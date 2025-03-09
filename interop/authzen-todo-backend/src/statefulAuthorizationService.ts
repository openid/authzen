import { OpenFGAStatefulAuthorizationService } from "./stateful/openfga";
import { StatefulAuthorizationService } from "interfaces";

export function createStatefulAuthorizationService( pdpBaseName:string, pdpAuthHeader:string, pdpHeader:string): StatefulAuthorizationService {
  console.log(pdpHeader);
  switch (pdpHeader.toLowerCase()) {
    case "openfga":
      return new OpenFGAStatefulAuthorizationService(pdpBaseName, pdpAuthHeader);
    default:
      return new NullStatefulAuthorizationService();
  }
}

class NullStatefulAuthorizationService implements StatefulAuthorizationService {
  insert(_todoId: string, _userId: string): Promise<void> {
    return Promise.resolve();
  }

  delete(_todoId: string, _userId: string): Promise<void> {
    return Promise.resolve();
  }
}