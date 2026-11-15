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
      @view = :list
      @selected = 0
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
            case wait(@refresh, keys)
            when :quit then break
            when :up then move_selection(-1)
            when :down then move_selection(1)
            when :enter then open_detail
            when :back then @view = :list
            end
          end
        end
      end
    ensure
      show_cursor
    end

    def print_frame
      @tick += 1
      hide_cursor if @io.tty?
      @io.print "\e[H\e[J" if @io.tty?
      @io.print frame
      @io.flush
    end

    # One whole frame as a string — pure rendering, no terminal state, so it
    # is directly testable.
    # The current screen: monitor list, or the detail view opened with Enter.
    def frame
      if @view == :detail
        monitor = SiteMonitor.find_by(id: @selected_id)
        return detail_frame(monitor) if monitor
        @view = :list
      end
      list_frame
    end

    def list_frame
      monitors = SiteMonitor.order(:name).to_a
      @monitors = monitors
      @incident_monitor_ids = Incident.where(resolved_at: nil).pluck(:monitor_id).to_set
      ev = events
      lines = [
        top_bar(monitors.size),
        box_line(header_body(@incident_monitor_ids.size)),
        mid_rule("monitors"),
        *table(monitors).map { |l| box_line(l) },
        *(ev.empty? ? [] : [ mid_rule("recent events"), *ev.map { |l| box_line(l) } ]),
        bottom_bar
      ]
      lines.join("\n")
    end

    def move_selection(delta)
      return if @monitors.nil? || @monitors.empty?
      @selected = (@selected + delta).clamp(0, @monitors.size - 1)
    end

    def open_detail
      return if @monitors.nil? || @monitors.empty?
      @selected_id = @monitors[@selected].id
      @view = :detail
    end

    # Detail view for one monitor — reached with Enter from the list.
    def detail_frame(monitor)
      @incident_monitor_ids = Incident.where(resolved_at: nil).pluck(:monitor_id).to_set
      checks = monitor.checks.limit(8).to_a
      lines = [
        top_bar("monitor detail"),
        box_line("#{pad(truncate(monitor.name), NAME_W)} #{@pastel.dim("#{monitor.http_method} #{monitor.host}")}"),
        mid_rule("status"),
        box_line(status_line(monitor)),
        mid_rule("uptime"),
        box_line(uptime_line(monitor)),
        box_line(bar_for(monitor)),
        *recent_check_lines(checks),
        bottom_bar(back: true)
      ]
      lines.join("\n")
    end

    private
      def status_line(monitor)
        status = case monitor.last_status
        when "up" then @pastel.green("● up")
        when "down" then @pastel.red("✕ down")
        when "degraded" then @pastel.yellow("◐ degraded")
        else @pastel.dim("◌ pending")
        end
        last = monitor.last_checked_at ? "#{format_duration((Time.current - monitor.last_checked_at).to_i)} ago" : "never"
        "#{status} #{@pastel.dim("·")} #{@pastel.dim("last check")} #{last} #{@pastel.dim("·")} #{@pastel.dim("expected")} #{monitor.expected_status} #{@pastel.dim("·")} #{@pastel.dim("every")} #{fmt_interval(monitor.interval_seconds)}"
      end

      def uptime_line(monitor)
        [ [ "24h", monitor.uptime_percentage(24.hours) ],
          [ "7d", monitor.uptime_percentage(7.days) ],
          [ "30d", monitor.uptime_percentage(30.days) ]
        ].map { |label, pct| "#{@pastel.dim(label)} #{pct.nil? ? @pastel.dim("—") : "#{pct}%"}" }.join(@pastel.dim("   "))
      end

      def recent_check_lines(checks)
        return [] if checks.empty?

        lines = [ mid_rule("recent checks") ]
        lines + checks.map do |c|
          glyph = case c.status
          when "up" then @pastel.green("✓")
          when "degraded" then @pastel.yellow("◐")
          else @pastel.red("✕")
          end
          bits = [ c.http_status || "—", c.latency_ms ? "#{c.latency_ms.round} ms" : "—", c.error ].compact
          box_line("#{glyph} #{@pastel.dim(c.checked_at.strftime("%H:%M"))} #{bits.join(@pastel.dim("  "))}")
        end
      end

      # --- the frame: one box-drawing panel with titled section separators,
      #     k9s/lazygit style ------------------------------------------
      def top_bar(count_or_label)
        label = count_or_label.is_a?(Integer) ? "#{count_or_label} monitor#{"s" unless count_or_label == 1}" : count_or_label
        title = @pastel.bold(" beacondock ")
        sub = @pastel.dim(" #{label} ")
        clock = @pastel.dim(" #{Time.current.strftime("%H:%M:%S")} ")
        dashes = content_width - 2 - visible(title) - visible(sub) - visible(clock) - 1
        "#{@pastel.dim("┌─")}#{title}#{sub}#{@pastel.dim("─" * [ dashes - 1, 0 ].max + "─")}#{clock}#{@pastel.dim("┐")}"
      end

      def mid_rule(label)
        text = @pastel.dim(" #{label} ")
        "#{@pastel.dim("├")}#{text}#{@pastel.dim("─" * [ content_width - 2 - visible(text), 0 ].max)}#{@pastel.dim("┤")}"
      end

      def bottom_bar(back: false)
        cursor = @tick.even? ? "█" : " "
        hint = back ? "esc back · q quit" : "↑↓ select · enter detail · r refresh · q quit"
        text = " #{@pastel.yellow(cursor)} #{@pastel.dim("#{hint} · live every #{@refresh} s")} "
        "#{@pastel.dim("└")}#{text}#{@pastel.dim("─" * [ content_width - 2 - visible(text), 0 ].max)}#{@pastel.dim("┘")}"
      end

      def box_line(content)
        "#{@pastel.dim("│")} #{pad_visible(content, content_width - 4)} #{@pastel.dim("│")}"
      end

      def header_body(open)
        parts = open.zero? ? [ @pastel.green("all operational") ] : [ @pastel.red("#{open} incident#{"s" if open > 1} open") ]
        parts << @pastel.dim("next check #{next_check_in}")
        parts.join(@pastel.dim(" · "))
      end

      def next_check_in
        at = SiteMonitor.active.minimum(:next_check_at)
        return "—" if at.nil?

        seconds = (at - Time.current).to_i
        return "now" if seconds <= 0
        "in #{format_duration(seconds)}"
      end

      def content_width = [ [ terminal_width, 110 ].min, 56 ].max

      # Fixed columns total ~61-70 chars; the uptime bar absorbs whatever is
      # left inside the box so it is always as long as it can be.
      def inner_width = content_width - 4

      def bar_days
        fixed = NAME_W + 1 + 6 + 1 + 5 + 1 + 11 + 1 + 8 + 1 + 8 + 1
        fixed += TREND_W + 1 if trend?
        (inner_width - fixed).clamp(BAR_MIN, BAR_MAX)
      end

      def trend? = inner_width >= TREND_MIN_WIDTH

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
        [ @pastel.dim(head), *monitors.map.with_index { |m, i| row(m, !@once && i == @selected) } ]
      end

      def row(monitor, selected = false)
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

        name_text = selected ? "▸ #{truncate(monitor.name, NAME_W - 3)}" : truncate(monitor.name)
        name_cell = pad(name_text, NAME_W)
        name_cell = @pastel.inverse(name_cell) if selected
        name_cell = @pastel.red(name_cell) if @incident_monitor_ids&.include?(monitor.id) && !selected
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
        entries.sort_by { |t, _, _| -t.to_i }.first(EVENTS_LIMIT).map do |t, glyph, text|
          "#{glyph} #{@pastel.dim(t.strftime("%H:%M"))} #{text}"
        end
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
        rescue Interrupt
          keys << "q"
        rescue StandardError
          nil # non-interactive stdin: the dashboard simply ignores keys
        end
        keys
      end

      # TTY::Reader returns raw strings: \e[A-style sequences on Unix,
      # à-prefixed Win32 scan codes on Windows (see Keys.win_keys).
      KEY_ACTIONS = {
        "q" => :quit, "\u0003" => :quit,
        "r" => :refresh,
        "up" => :up, :up => :up, "\e[A" => :up, "k" => :up,
        "down" => :down, :down => :down, "\e[B" => :down, "j" => :down,
        "\u00E0H" => :up, "\u00E0P" => :down,
        "enter" => :enter, :enter => :enter, "\r" => :enter, "\n" => :enter,
        "escape" => :back, :escape => :back, "\e" => :back,
        "backspace" => :back, :backspace => :back, "\u007F" => :back, "h" => :back
      }.freeze


      def wait(seconds, keys)
        deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + seconds
        loop do
          begin
            action = KEY_ACTIONS[keys.pop(true)]
            return action if action
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

      def truncate(text, width = NAME_W) = text.length > width - 1 ? "#{text[0, width - 2]}…" : text

      # Visible length ignoring ANSI escapes.
      def visible(text) = text.gsub(/\e\[[0-9;]*m/, "").length

      # Right-pad to a visible width — ANSI codes don't count toward length.
      def pad_visible(text, width) = text + " " * [ width - visible(text), 0 ].max

      def hide_cursor = @io.print "\e[?25l"

      def show_cursor
        @io.print "\e[?25h" if @io.tty?
      end
  end
end
