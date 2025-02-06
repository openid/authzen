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
import { queryClient } from "../utils/queryClient";

interface ConfigContextType {
  headers: Headers;
  isLoading: boolean;
  availablePDPs: string[];
  gateway: string | undefined;
  gatewayPdp: string | undefined;
  gatewayPdps: string[];
  gateways: {
    [name: string]: string;
  };
  pdp: string | undefined;
  setGateway: (gateway: string) => void;
  setGatewayPdp: (gatewayPdp: string) => void;
  setPdp: (pdp: string) => void;
  specVersion: string | undefined;
  setSpecVersion: (specVersion: string) => void;
  specVersions: string[];
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { headers } = useAuth();
  const { getConfig } = createConfigApi(headers);

  const [gateway, setGateway] = useState<string | undefined>(
    () => localStorage.getItem("gateway") || undefined
  );
  const [gatewayPdp, setGatewayPdp] = useState<string | undefined>(
    () => localStorage.getItem("gatewayPdp") || undefined
  );
  const [pdp, setPdp] = useState<string | undefined>(
    () => localStorage.getItem("pdp") || undefined
  );
  const [specVersion, setSpecVersion] = useState<string | undefined>(
    () => localStorage.getItem("specVersion") || undefined
  );

  const { data: config, isLoading } = useQuery({
    queryKey: ["pdps"],
    queryFn: async () => getConfig() as unknown as Config,
    select: (data: Config) => {
      const versions = Object.keys(data.pdps);
      const currentSpec = (specVersion && versions.includes(specVersion)) ? specVersion : versions[0];
      if (!data.pdps[currentSpec]) {
        setSpecVersion(versions[0]);
      }
      const pdps = data.pdps[currentSpec] ?? data.pdps[0];
      const gateways = data.gateways;
      const gatewayPdps = data.gatewayPdps;

      return {
        versions,
        currentSpec,
        pdps,
        defaultPdp: pdp || pdps[0],
        gateways,
        defaultGateway: gateway || Object.keys(gateways)[0],
        gatewayPdps,
        defaultGatewayPdp: gatewayPdp || gatewayPdps[0],
      };
    },
  });

  useEffect(() => {
    if (config) {
      if (!specVersion || !Object.keys(config).includes(specVersion)) {
        setSpecVersion(config.currentSpec);
        queryClient.refetchQueries({ queryKey: ["todos"] });
      }
      if (!pdp || !config.pdps.includes(pdp)) {
        setPdp(config.defaultPdp);
        queryClient.refetchQueries({ queryKey: ["todos"] });
      }
      if (!gateway || !Object.keys(config.gateways).includes(gateway)) {
        setGateway(config.defaultGateway);
        queryClient.refetchQueries({ queryKey: ["todos"] });
      }
      if (!gatewayPdp || !config.gatewayPdps.includes(gatewayPdp)) {
        setGatewayPdp(config.defaultGatewayPdp);
        queryClient.refetchQueries({ queryKey: ["todos"] });
      }
    }
  }, [config, specVersion, pdp, gateway, gatewayPdp]);

  const updateHeaders = useCallback(() => {
    const newHeaders = new Headers(headers);
    if (specVersion) {
      newHeaders.set("X_AUTHZEN_SPEC_VERSION", specVersion);
    }
    if (pdp) {
      newHeaders.set("X_AUTHZEN_PDP", pdp);
    }
    if (gatewayPdp) {
      newHeaders.set("X_AUTHZEN_GATEWAY_PDP", gatewayPdp);
    }
    return newHeaders;
  }, [headers, specVersion, pdp, gatewayPdp]);

  const value = useMemo(
    () => ({
      headers: updateHeaders(),
      isLoading: isLoading || !config?.pdps || !pdp || !specVersion || !gateway || !gatewayPdp,
      availablePDPs: config?.pdps ?? [],
      gateway,
      gatewayPdps: config?.gatewayPdps ?? [],
      gateways: config?.gateways ?? {},
      setGateway: (newGateway: string) => {
        localStorage.setItem("gateway", newGateway);
        setGateway(newGateway);
      },
      gatewayPdp,
      setGatewayPdp: (newGatewayPdp: string) => {
        localStorage.setItem("gatewayPdp", newGatewayPdp);
        setGatewayPdp(newGatewayPdp);
      },
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
    [config, gateway, gatewayPdp, isLoading, pdp, specVersion, updateHeaders]
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
