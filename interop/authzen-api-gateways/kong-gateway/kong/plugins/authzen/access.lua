local cjson = require "cjson"
-- module
local _M = {}

local function evaluate(pidreq,conf)
    local http = require "resty.http"
    local httpc = http.new()
    kong.log.notice("AuthZEN request: ", pidreq)
    local pdpurls = conf.server.pdp_url
    local keys = os.getenv("PDP_KEYS")
    local keysObj = cjson.decode(keys)
    local pdps = cjson.decode(pdpurls)
    local pdpurl = "https://authzeninteropt.se-plainid.com"
    local key = nil
    local pdp = ngx.req.get_headers()['x_authzen_gateway_pdp']
    if pdp ~= nil then
        local tmp = pdps[pdp]
        if tmp ~= nil then
            pdpurl = tmp
        end
        key = keysObj[pdp]
    end

    local uri = pdpurl .. "/access/v1/evaluation"
    kong.log.notice("AuthZEN endpoint: " ,uri)

    local headers = {
        ["Content-Type"] = "application/json"
    }
    if key ~= nil then
        headers['Authorization'] = key
    end
    local res, err = httpc:request_uri(uri, {
        method = "POST",
        body = pidreq,
        headers = headers,
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

--TODO: Very naive :)
local function replace_values_by_keys()
    local m = ngx.ctx.router_matches
    local modified = ngx.var.uri
    if m.uri_captures ~= nil then
        for k, v in pairs(m.uri_captures) do
            if type(v) == "string" and type(k) == "string" then
                local pattern = v:gsub("([%^%$%(%)%%%.%[%]%*%+%-%?])", "%%%1") -- Escape special characters in the value
                modified = modified:gsub("/" .. pattern, "/{" .. k .. "}")
            end
        end
    end
    return modified
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

    local route = replace_values_by_keys()
    if route == nil then
        route = ngx.var.uri
    end

    local id = decoded_token.claims.sub
    local authzen_request = {
        subject = {
            type = "identity",
            id = id
        },
        resource = {
            type = "route",
            id = route
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
