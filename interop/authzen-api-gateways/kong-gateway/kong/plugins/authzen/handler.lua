local access = require "kong.plugins.authzen.access"

local AuthZenHandler = {
  -- This plugin should be executed after any authentication plugins enabled on the Service or Route.
  -- The priority is set to execute this plugin after the response-ratelimiting plugin:
  -- https://docs.konghq.com/2.0.x/plugin-development/custom-logic/#plugins-execution-order
  PRIORITY = 899, -- set the plugin priority, which determines plugin execution order
  VERSION = "0.1"
}

function AuthZenHandler:access(conf)
  kong.log.debug("executing plugin \"authzen\": access")
  access.execute(conf)
end

-- return handler
return AuthZenHandler
