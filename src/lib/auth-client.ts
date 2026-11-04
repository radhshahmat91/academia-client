import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, jwtClient } from "better-auth/client/plugins";
import type { Auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [jwtClient(), inferAdditionalFields<Auth>()],
});

export const { useSession } = authClient;
