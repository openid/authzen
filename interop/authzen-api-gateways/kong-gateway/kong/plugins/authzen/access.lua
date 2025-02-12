local cjson = require "cjson"
-- module
local _M = {}

local function evaluate(pidreq,conf)
    local http = require "resty.http"
    local httpc = http.new()
    kong.log.notice("AuthZEN request: ", pidreq)
    local pdpurls = conf.server.pdp_url
    local pdps = cjson.decode(pdpurls)
    local pdpurl = "https://authzeninteropt.se-plainid.com"
    local pdp = ngx.req.get_headers()['x_authzen_gateway_pdp']
    if pdp ~= nil then
        local tmp = pdps[pdp]
        if tmp ~= nil then
            pdpurl = tmp
        end
    end
    local uri = pdpurl .. "/access/v1/evaluation"
    kong.log.notice("AuthZEN endpoint: " ,uri)
    local res, err = httpc:request_uri(uri, {
        method = "POST",
        body = pidreq,
        headers = {
          ["Content-Type"] = "application/json"
        },
        keepalive_timeout = 60,
        keepalive_pool = 10
      })
    if err then
        kong.log.error("AuthZEN error: " ,err)
        return kong.response.exit(403, {
            message = {
                authzen_err = err
            }
          })
    end
    kong.log.notice("AuthZEN Response: " ,res['body'])
    if res.status ~= 200  then
          return kong.response.exit(403, {
            message = {
                authzen_err = res['body']
            }
          })
    end
    return res['body']
end

local function return_err(msg)
    kong.log.info(msg)
    ngx.header['Content-Type'] = "application/json"
    local message = {
        message = msg
    }
    return kong.response.exit(403, message)    
end

function _M.execute(conf)
    kong.log.info("Starting AuthZEN Plugin........")
    
    local authorization = ngx.var.http_authorization
    if authorization == nil then
        return return_err("No Bearer token provided")
    end
    local jwt;
    local sep = authorization:find(' ')

    if string.lower(authorization:sub(0, sep-1)) == string.lower("Bearer") then
        jwt = authorization:sub(sep+1)
    else
        return return_err("No Bearer token provided")
    end
    local jwt_decoder = require "kong.plugins.jwt.jwt_parser"
    local decoded_token, err = jwt_decoder:new(jwt)
    if err then
        return return_err("No Bearer token provided")
    end
    
    kong.log.info(decoded_token.claims)

    
    local id = decoded_token.claims.sub
    local authzen_request = {
        subject = {
            type = "user",
            id = id
        },
        resource = {
            type = "route",
            id = ngx.var.uri
        },
        action = {
            name = ngx.var.request_method
        }
    }
      
    
 
    local pidreq = cjson.encode(authzen_request)
    local rsp = evaluate(pidreq,conf)
    local data = cjson.decode(rsp)
    local result = data.decision
    if not result then
      return return_err("AuthZEN: Access Forbidden")
    end

end

return _M
