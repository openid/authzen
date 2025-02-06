import { useConfig } from "../context/ConfigContext";
import Select from "react-select";

export function AuthZENSettings() {
  const {
    availablePDPs: avaliablePDPs,
    gateway,
    gatewayPdp,
    gatewayPdps,
    gateways,
    pdp,
    setGateway,
    setGatewayPdp,
    setPdp,
    setSpecVersion,
    specVersion,
    specVersions,
  } = useConfig();

  return (
    <>
      <div className="pdp-info">
        <span className="select-title">AuthZEN version:</span>
        <Select
          className="pdp-select"
          isSearchable={false}
          options={specVersions.map((specVersion) => {
            return { label: specVersion, value: specVersion };
          })}
          value={{ label: specVersion, value: specVersion }}
          onChange={(option) => option?.value && setSpecVersion(option.value)}
        />
      </div>
      <div className="pdp-info">
        <span className="select-title">Authorize using:</span>
        <Select
          className="pdp-select"
          isSearchable={false}
          options={avaliablePDPs.map((pdp) => {
            return { label: pdp, value: pdp };
          })}
          value={{ label: pdp, value: pdp }}
          onChange={(option) => option?.value && setPdp(option.value)}
        />
      </div>
      <div className="pdp-info">
        <span className="select-title">API Gateway:</span>
        <Select
          className="pdp-select"
          isSearchable={false}
          options={Object.keys(gateways).map((gateway) => {
            return { label: gateway, value: gateways[gateway] };
          })}
          value={{ label: gateway, value: gateways[gateway ?? Object.keys(gateways)[0]] }}
          onChange={(option) => option?.label && setGateway(option.label)}
        />
      </div>
      <div className="pdp-info">
        <span className="select-title">Gateway PDP:</span>
        <Select
          className="pdp-select"
          isSearchable={false}
          options={gatewayPdps.map((gatewayPdp) => {
            return { label: gatewayPdp, value: gatewayPdp };
          })}
          value={{ label: gatewayPdp, value: gatewayPdp }}
          onChange={(option) => option?.value && setGatewayPdp(option.value)}
        />
      </div>
    </>
  );
}
