import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";

export function UserCard() {
  const auth = useAuth();
  const { user } = useUser(auth.userData?.profile.sub);

  return (
    <div className="user-info">
      <span className="user-name">
        Logged in as: <b>{auth.userData?.profile.email}</b>
      </span>
      {user?.picture ? (
        <span className="user-picture">
          <img
            alt="user"
            style={{
              borderRadius: "50%",
              width: 50,
              height: 50,
            }}
            src={user.picture}
          />
        </span>
      ) : null}
    </div>
  );
}
