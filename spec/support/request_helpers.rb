# Request specs send no User-Agent; ApplicationController's `allow_browser`
# would treat that as an unsupported browser. Send a modern UA on every
# request so specs exercise the real middleware stack.
module ModernBrowserHeaders
  MODERN_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " \
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36".freeze

  %i[get post put patch delete head].each do |verb|
    define_method(verb) do |*args, **kwargs, &block|
      kwargs[:headers] = (kwargs[:headers] || {}).reverse_merge("User-Agent" => MODERN_UA)
      super(*args, **kwargs, &block)
    end
  end
end

RSpec.configure do |config|
  config.include ModernBrowserHeaders, type: :request
end
