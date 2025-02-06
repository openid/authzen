import { useQuery } from "@tanstack/react-query";
import { createUserApi } from "../api/userApi";
import { useConfig } from "../context/ConfigContext";
import { User } from "../interfaces";

export const useUser = (userId?: string) => {
  const { headers, gateways, gateway } = useConfig();
  const url = gateways[gateway ?? Object.keys(gateways)[0]];
  const { getUser } = createUserApi(url, headers);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId!) as unknown as User,
    enabled: !!userId,
  });

  return {
    user,
    isLoading,
  };
};
