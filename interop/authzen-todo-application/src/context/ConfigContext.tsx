import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { createConfigApi } from "../api/configApi";
import { useQuery } from "@tanstack/react-query";
import { Config } from "../interfaces";

interface ConfigContextType {
  headers: Headers;
  isLoading: boolean;
  avaliablePDPs: string[];
  pdp: string | undefined;
  setPdp: (pdp: string) => void;
  specVersion: string | undefined;
  setSpecVersion: (specVersion: string) => void;
  specVersions: string[];
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { headers } = useAuth();
  const { getPDPs } = createConfigApi(headers);

  const [pdp, setPdp] = useState<string | undefined>(undefined);
  const [avaliablePDPs, setAvaliablePDPs] = useState<string[]>([]);
  const [specVersion, setSpecVersion] = useState<string | undefined>(undefined);
  const [specVersions, setSpecVersions] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["pdps"],
    queryFn: async () => getPDPs() as unknown as Config,
  });

  useEffect(() => {
    if (data) {
      const versions = Object.keys(data);
      setSpecVersions(versions);

      const spec = localStorage.getItem("specVersion") ?? versions[0];
      setSpecVersion(spec);
      setAvaliablePDPs(data[spec]);

      setPdp(localStorage.getItem("pdp") ?? data[spec][0]);
    }
  }, [data]);

  useEffect(() => {
    if (specVersion) {
      headers.set("X_AUTHZEN_SPEC_VERSION", specVersion);
    }
    if (pdp) {
      headers.set("X_AUTHZEN_PDP", pdp);
    }
  }, [specVersion, pdp]);

  const value = {
    headers,
    isLoading: isLoading || !avaliablePDPs || !pdp || !specVersion,
    avaliablePDPs,
    pdp,
    setPdp: (pdp: string) => {
      localStorage.setItem("pdp", pdp);
      setPdp(pdp);
    },
    specVersion,
    setSpecVersion: (specVersion: string) => {
      localStorage.setItem("specVersion", specVersion);
      setSpecVersion(specVersion);
      setAvaliablePDPs(avaliablePDPs);
      setPdp(avaliablePDPs[0]);
    },
    specVersions,
  };

  console.log(value);

  if (value.isLoading) {
    return <div>Loading config...</div>;
  }

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within an ConfigProvider");
  }
  return context;
}
