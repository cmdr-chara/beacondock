# Terminal UI: a live monitoring dashboard rendered in the shell.
#
# Reads the same database as the web app and the jobs worker, so frames are
# live — as checks land, statuses, latencies and uptime bars update on the
# next render. Run it with `ruby bin/beacondock` (or `--once` for a single
# frame, e.g. in pipes, screenshots and tests).
#
#   q quit · r refresh · updates every 5 s
#
module Tui
  class Dashboard
    REFRESH_SECONDS = 5
    BAR_DAYS = 30
    NARROW_BAR_DAYS = 10
    WIDE = 84
    EVENTS_LIMIT = 6
    NAME_W = 20

    def initialize(io: $stdout, refresh: REFRESH_SECONDS, once: false, color: nil)
      @io = io
      @refresh = refresh
      @once = once
      @pastel = Pastel.new(enabled: color.nil? ? io.tty? : color)
    end

    def run
      if @once
        print_frame
      else
        keys = listen
        trap("INT") { throw :quit }
        catch(:quit) do
          loop do
            print_frame
            break if wait(@refresh, keys) == :quit
          end
        end
      end
    ensure
      show_cursor
    end

    # One whole frame as a string — pure rendering, no terminal state, so it
    # is directly testable.
    def frame
      monitors = SiteMonitor.order(:name).to_a
      open = Incident.where(resolved_at: nil).count
      lines = [
        header(monitors.size, open),
        "",
        *table(monitors),
        "",
        *events,
        "",
        @pastel.dim(" q quit · r refresh · updates every #{@refresh} s")
      ]
      lines.join("\n")
    end

    private
      def print_frame
        hide_cursor if @io.tty?
        @io.print "\e[H\e[J" if @io.tty?
        @io.print frame
        @io.flush
      end

      def header(count, open)
        brand = @pastel.bold("beacondock")
        parts = [ "#{count} monitors" ]
        parts << (open.zero? ? @pastel.green("all operational") : @pastel.red("#{open} incident#{"s" if open > 1} open"))
        "#{brand} #{@pastel.dim("—")} #{parts.join(@pastel.dim(" · "))}#{@pastel.dim(" · ")}#{Time.current.strftime("%H:%M:%S")}"
      end

      def table(monitors)
        return [ @pastel.dim(" no monitors yet — add one in the web app") ] if monitors.empty?

        head = @pastel.dim(pad("monitor", NAME_W) + " " + pad("method", 6) + " " + pad("every", 6) + " " + pad("status", 11) + " " + pad("latency", 8) + " uptime #{BAR_DAYS}d")
        [ head, *monitors.map { |m| row(m) } ]
      end

      def row(monitor)
        status = case monitor.last_status
        when "up" then @pastel.green(pad("● up", 11))
        when "down" then @pastel.red(pad("✕ down", 11))
        when "degraded" then @pastel.yellow(pad("◐ degraded", 11))
        else @pastel.dim(pad("◌ pending", 11))
        end
        latency = monitor.checks.first&.latency_ms
        latency_cell = latency.nil? ? @pastel.dim(pad("—", 8)) : pad("#{latency.round} ms", 8)
        pct = monitor.uptime_percentage(BAR_DAYS.days)
        pct_cell = pct.nil? ? @pastel.dim("—") : "#{pct}%"

        pad(truncate(monitor.name), NAME_W) + " " +
          pad(monitor.http_method, 6) + " " +
          pad("#{monitor.interval_seconds} s", 6) + " " +
          status + " " +
          latency_cell + " " +
          bar_for(monitor) + " " + pct_cell
      end

      # Worst check status per day, oldest first — the same strip the public
      # status page renders (down > degraded > up; empty days stay dim).
      def bar_for(monitor)
        statuses = daily_statuses(monitor, BAR_DAYS)
        statuses = statuses.last(NARROW_BAR_DAYS) if narrow?
        statuses.map do |s|
          case s
          when "up" then @pastel.green("▇")
          when "degraded" then @pastel.yellow("▁")
          when "down" then @pastel.red("x")
          else @pastel.dim("·")
          end
        end.join
      end

      def daily_statuses(monitor, days)
        severity = { "down" => 3, "degraded" => 2, "up" => 1 }
        by_day = monitor.checks.where(checked_at: days.days.ago.beginning_of_day..)
          .pluck(:checked_at, :status)
          .group_by { |checked_at, _| checked_at.to_date }
        (0...days).map do |i|
          statuses = by_day.fetch(Date.current - (days - 1 - i), []).map(&:last)
          statuses.max_by { |s| severity.fetch(s, 0) }
        end
      end

      def events
        incidents = Incident.includes(:monitor).order(started_at: :desc).limit(EVENTS_LIMIT)
        return [] if incidents.empty?

        entries = incidents.flat_map do |i|
          e = [ [ i.started_at, @pastel.yellow("!"), "#{i.monitor.name} #{@pastel.dim("—")} #{i.cause}" ] ]
          if i.resolved_at
            e << [ i.resolved_at, @pastel.green("✓"), "#{i.monitor.name} #{@pastel.dim("—")} resolved after #{format_duration(i.resolved_at - i.started_at)}" ]
          end
          e
        end
        lines = [ @pastel.dim(" recent events") ]
        lines + entries.sort_by { |t, _, _| -t.to_i }.first(EVENTS_LIMIT).map do |t, glyph, text|
          " #{glyph} #{@pastel.dim(t.strftime("%H:%M"))} #{text}"
        end
      end

      def format_duration(seconds)
        s = seconds.to_i
        return "#{s}s" if s < 60
        return "#{s / 60}m #{s % 60}s" if s < 3600
        "#{s / 3600}h #{(s % 3600) / 60}m"
      end

      # --- keypress loop -------------------------------------------------
      def listen
        keys = Queue.new
        Thread.new do
          reader = TTY::Reader.new
          loop { keys << reader.read_keypress }
        rescue StandardError
          nil # non-interactive stdin: the dashboard simply ignores keys
        end
        keys
      end

      def wait(seconds, keys)
        deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + seconds
        loop do
          begin
            case keys.pop(true)
            when "q", "" then return :quit
            when "r" then return :refresh
            end
          rescue ThreadError
          end
          return :tick if Process.clock_gettime(Process::CLOCK_MONOTONIC) >= deadline
          sleep 0.05
        end
      end

      # --- terminal plumbing ---------------------------------------------
      def narrow? = terminal_width < WIDE

      def terminal_width = TTY::Screen.width

      def pad(text, width) = format("%-#{width}s", text)

      def truncate(text) = text.length > NAME_W - 1 ? "#{text[0, NAME_W - 2]}…" : text

      def hide_cursor = @io.print "\e[?25l"

      def show_cursor
        @io.print "\e[?25h" if @io.tty?
      end
  end
end
