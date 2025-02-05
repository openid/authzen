import { useConfig } from "../context/ConfigContext";
import Select from "react-select";

export function AuthZENSettings() {
  const {
    avaliablePDPs,
    pdp,
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
    </>
  );
}
