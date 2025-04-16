import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Route } from "./+types/action";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API - Action Search" }];
}

export default function ActionSearch() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Search</CardTitle>
        <CardDescription>
          Select a subject and resource to get the possible actions
        </CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}
