# Terminal UI: a live monitoring dashboard rendered in the shell.
#
# Reads the same database as the web app and the jobs worker, so frames are
# live — as checks land, statuses, latencies and uptime bars update on the
# next render. Run it with `ruby bin/beacondock` (or `--once` for a single
# frame, e.g. in pipes, screenshots and tests).
#
#   q quit · r refresh · updates every 5 s
#
require "set" # Enumerable#to_set — core only since Ruby 4.0

module Tui
  class Dashboard
    REFRESH_SECONDS = 5
    BAR_MAX = 30
    BAR_MIN = 10
    EVENTS_LIMIT = 6
    NAME_W = 20
    TREND_W = 8
    TREND_MIN_WIDTH = 104
    SPARK = "▁▂▃▄▅▆▇█"

    def initialize(io: $stdout, refresh: REFRESH_SECONDS, once: false, color: nil)
      @io = io
      @refresh = refresh
      @once = once
      @pastel = Pastel.new(enabled: color.nil? ? io.tty? : color)
      @tick = 0
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
      @incident_monitor_ids = Incident.where(resolved_at: nil).pluck(:monitor_id).to_set
      [
        header(monitors.size, @incident_monitor_ids.size),
        rule,
        "",
        *table(monitors),
        "",
        *events,
        rule,
        footer
      ].join("\n")
    end

    private
      def print_frame
        @tick += 1
        hide_cursor if @io.tty?
        @io.print "\e[H\e[J" if @io.tty?
        @io.print frame
        @io.flush
      end

      def header(count, open)
        parts = [ "#{count} monitor#{"s" if count != 1}" ]
        parts << if open.zero?
          @pastel.green("all operational")
        else
          @pastel.red("#{open} incident#{"s" if open > 1} open")
        end
        parts << @pastel.dim("next check #{next_check_in}")
        left = "#{@pastel.bold("beacondock")} #{@pastel.dim("—")} #{parts.join(@pastel.dim(" · "))}"
        clock = Time.current.strftime("%H:%M:%S")
        left + " " * [ 1, content_width - visible(left) - clock.length ].max + @pastel.dim(clock)
      end

      def next_check_in
        at = SiteMonitor.active.minimum(:next_check_at)
        return "—" if at.nil?

        seconds = (at - Time.current).to_i
        return "now" if seconds <= 0
        "in #{format_duration(seconds)}"
      end

      def rule = @pastel.dim("─" * content_width)

      def content_width = [ terminal_width, 110 ].min

      # Fixed columns total ~61-70 chars; the uptime bar absorbs whatever is
      # left of the terminal so it is always as long as it can be.
      def bar_days
        fixed = NAME_W + 1 + 6 + 1 + 5 + 1 + 11 + 1 + 8 + 1 + 8 + 1
        fixed += TREND_W + 1 if trend?
        (content_width - fixed).clamp(BAR_MIN, BAR_MAX)
      end

      def trend? = content_width >= TREND_MIN_WIDTH

      def table(monitors)
        return [ @pastel.dim(" no monitors yet — add one in the web app") ] if monitors.empty?

        head = "  " + pad("monitor", NAME_W) + " " +
          pad("method", 6) + " " +
          pad("every", 5) + " " +
          pad("status", 11) + " " +
          rpad("latency", 8) + " " +
          (trend? ? pad("", TREND_W) + " " : "") +
          pad("uptime", bar_days) + " " +
          rpad("#{BAR_MAX}d", 8)
        [ @pastel.dim(head), *monitors.map { |m| row(m) } ]
      end

      def row(monitor)
        status = case monitor.last_status
        when "up" then @pastel.green(pad("● up", 11))
        when "down" then @pastel.red(pad("✕ down", 11))
        when "degraded" then @pastel.yellow(pad("◐ degraded", 11))
        else @pastel.dim(pad("◌ pending", 11))
        end

        latency = monitor.checks.first&.latency_ms
        latency_cell =
          if latency.nil?
            @pastel.dim(rpad("—", 8))
          elsif latency >= monitor.warn_latency_ms
            @pastel.yellow(rpad("#{latency.round} ms", 8))
          else
            rpad("#{latency.round} ms", 8)
          end

        pct = monitor.uptime_percentage(BAR_MAX.days)
        pct_cell =
          if pct.nil?
            @pastel.dim(rpad("—", 8))
          else
            cell = rpad("#{pct}%", 8)
            pct >= 99.9 ? @pastel.green(cell) : pct >= 99 ? @pastel.yellow(cell) : @pastel.red(cell)
          end

        name_cell = pad(truncate(monitor.name), NAME_W)
        name_cell = @pastel.red(name_cell) if @incident_monitor_ids&.include?(monitor.id)
        "  " + name_cell + " " +
          pad(monitor.http_method, 6) + " " +
          pad(fmt_interval(monitor.interval_seconds), 5) + " " +
          status + " " +
          latency_cell + " " +
          (trend? ? trend(monitor) + " " : "") +
          bar_for(monitor) + " " + pct_cell
      end

      # Mini sparkline of recent latencies — same data the web detail page
      # charts, in eight block characters.
      def trend(monitor)
        values = monitor.recent_latencies(TREND_W).last(TREND_W)
        return @pastel.dim(pad("·" * TREND_W, TREND_W)) if values.size < 2

        max = values.max.to_f
        max = 1.0 if max.zero?
        spark = values.map { |v| SPARK[(v / max * (SPARK.size - 1)).round] }.join
        @pastel.cyan(pad(spark, TREND_W))
      end

      # Worst check status per day, oldest first — the same strip the public
      # status page renders (down > degraded > up; empty days stay dim).
      def bar_for(monitor)
        # The most recent days, right-aligned — at narrow widths the strip
        # keeps its newest data instead of squeezing all 30.
        statuses = daily_statuses(monitor, BAR_MAX).last(bar_days)
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
          e = [ [ i.started_at, i.resolved_at ? @pastel.yellow("!") : @pastel.red("▲"),
                  "#{i.monitor.name} #{@pastel.dim("—")} #{i.cause}" ] ]
          if i.resolved_at
            e << [ i.resolved_at, @pastel.green("✓"),
                   "#{i.monitor.name} #{@pastel.dim("—")} resolved after #{format_duration(i.resolved_at - i.started_at)}" ]
          end
          e
        end
        [ @pastel.dim(" recent events") ] +
          entries.sort_by { |t, _, _| -t.to_i }.first(EVENTS_LIMIT).map do |t, glyph, text|
            " #{glyph} #{@pastel.dim(t.strftime("%H:%M"))} #{text}"
          end
      end

      def footer
        cursor = @tick.even? ? "█" : " "
        "#{@pastel.yellow(cursor)} #{@pastel.dim("q quit · r refresh · live every #{@refresh} s")}"
      end

      def format_duration(seconds)
        s = seconds.to_i
        return "#{s}s" if s < 60
        return "#{s / 60}m #{s % 60}s" if s < 3600
        "#{s / 3600}h #{(s % 3600) / 60}m"
      end

      def fmt_interval(seconds) = seconds < 60 ? "#{seconds}s" : seconds < 3600 ? "#{seconds / 60}m" : "#{seconds / 3600}h"

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
      def terminal_width = TTY::Screen.width

      def pad(text, width) = format("%-#{width}s", text)

      def rpad(text, width) = format("%#{width}s", text)

      def truncate(text) = text.length > NAME_W - 1 ? "#{text[0, NAME_W - 2]}…" : text

      # Visible length ignoring ANSI escapes.
      def visible(text) = text.gsub(/\e\[[0-9;]*m/, "").length

      def hide_cursor = @io.print "\e[?25l"

      def show_cursor
        @io.print "\e[?25h" if @io.tty?
      end
  end
end
