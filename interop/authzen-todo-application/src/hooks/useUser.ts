import { useQuery } from "@tanstack/react-query";
import { createUserApi } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import { User } from "../interfaces";

export const useUser = (userId?: string) => {
  const { headers } = useAuth();
  const { getUser } = createUserApi(headers);

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
