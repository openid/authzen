import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Route } from "./+types/action";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API - Subject Search" }];
}

export default function SubjectSearch() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Search</CardTitle>
        <CardDescription>
          Select a resource and action to get the subjects which can perform the
          action
        </CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}
