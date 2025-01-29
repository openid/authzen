import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const [pdp, setPdp] = useState<string | undefined>(
    () => localStorage.getItem("pdp") || undefined
  );
  const [specVersion, setSpecVersion] = useState<string | undefined>(
    () => localStorage.getItem("specVersion") || undefined
  );

  const { data: config, isLoading } = useQuery({
    queryKey: ["pdps"],
    queryFn: async () => getPDPs() as unknown as Config,
    select: (data: Config) => {
      const versions = Object.keys(data);
      const currentSpec = specVersion || versions[0];
      const pdps = data[currentSpec];

      return {
        versions,
        currentSpec,
        pdps,
        defaultPdp: pdp || pdps[0],
      };
    },
  });

  useEffect(() => {
    if (config) {
      if (!specVersion || !Object.keys(config).includes(specVersion)) {
        setSpecVersion(config.currentSpec);
      }
      if (!pdp || !config.pdps.includes(pdp)) {
        setPdp(config.defaultPdp);
      }
    }
  }, [config, specVersion, pdp]);

  const updateHeaders = useCallback(() => {
    const newHeaders = new Headers(headers);
    if (specVersion) {
      newHeaders.set("X_AUTHZEN_SPEC_VERSION", specVersion);
    }
    if (pdp) {
      newHeaders.set("X_AUTHZEN_PDP", pdp);
    }
    return newHeaders;
  }, [headers, specVersion, pdp]);

  const value = useMemo(
    () => ({
      headers: updateHeaders(),
      isLoading: isLoading || !config?.pdps || !pdp || !specVersion,
      avaliablePDPs: config?.pdps ?? [],
      pdp,
      setPdp: (newPdp: string) => {
        localStorage.setItem("pdp", newPdp);
        setPdp(newPdp);
      },
      specVersion,
      setSpecVersion: (newSpecVersion: string) => {
        localStorage.setItem("specVersion", newSpecVersion);
        setSpecVersion(newSpecVersion);
        if (config) {
          const pdps = config.pdps;
          setPdp(pdps[0]);
        }
      },
      specVersions: config?.versions ?? [],
    }),
    [config, isLoading, pdp, specVersion, updateHeaders]
  );

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
