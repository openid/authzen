import type { Route } from "./+types/resource";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { pdpCookie } from "~/cookies.server";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { users } from "~/data/users.server";
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";
import { resourceResponse } from "~/lib/schema";
import { callPdp } from "~/lib/callPdp";
import { records } from "~/data/records.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API - Resource Search" }];
}

export async function loader({}: Route.LoaderArgs) {
  return {
    users,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await pdpCookie.parse(cookieHeader)) || {};
  if (!cookie.selectedPdp) {
    return {
      error: "No PDP selected",
    };
  }

  const formData = await request.formData();
  const user = formData.get("user");
  const resource = formData.get("resource");
  const action = formData.get("action");

  if (!user || users.find((s) => s.id === user) === undefined) {
    return {
      error: "Invalid subject selected",
    };
  }

  const authZENRequest = {
    subject: {
      type: "user",
      id: user,
    },
    action: {
      name: action,
    },
    resource: {
      type: resource,
    },
    context: {},
  };

  try {
    const response = await callPdp(
      "/access/v1/search/resource",
      authZENRequest,
      cookie.selectedPdp
    );

    const authZENResponse = resourceResponse.parse(response);

    const responseData = authZENResponse.results
      .map((record) => {
        return records.find((r) => r.id + "" === record.id);
      })
      .filter(Boolean);

    return {
      authZENRequest,
      authZENResponse,
      responseData,
    };
  } catch (error) {
    console.error("Error fetching data from PDP", error);
    return {
      error: "Error fetching data from PDP",
    };
  }
}

export default function ResourceSearch({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Search</CardTitle>
        <CardDescription>
          Select a user and action to get the resources it would be allowed upon
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="post" className="flex flex-col gap-4">
          <div className="mb-6 flex gap-4 items-center">
            <p className="font-semibold text-sm">Subject</p>
            <Select name="user" defaultValue={loaderData.users[0].id}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {loaderData.users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="font-semibold text-sm">Resource type</p>
            <Select name="resource" defaultValue="record">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select an resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="record">record</SelectItem>
              </SelectContent>
            </Select>
            <p className="font-semibold text-sm">Action</p>
            <Select name="action" defaultValue="view">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">view</SelectItem>
                <SelectItem value="edit">edit</SelectItem>
                <SelectItem value="delete">delete</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type={"submit"}
              disabled={navigation.state === "submitting"}
            >
              {navigation.state === "submitting" ? "Evaluating..." : "Evaluate"}
            </Button>
          </div>

          {actionData?.error && (
            <div className="text-red-500 mb-4">{actionData.error}</div>
          )}

          {actionData?.authZENResponse && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionData.responseData.map((resource) => (
                      <TableRow key={resource?.id}>
                        <TableCell className="font-medium">
                          {resource?.id}
                        </TableCell>
                        <TableCell>{resource?.title}</TableCell>
                        <TableCell>{resource?.department}</TableCell>
                        <TableCell>{resource?.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <Card className="bg-muted/40">
                  <CardHeader>
                    <div className="flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      <CardTitle>Request View</CardTitle>
                    </div>
                    <CardDescription>API request and response</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="request">
                      <TabsList className="mb-4">
                        <TabsTrigger value="request">Request</TabsTrigger>
                        <TabsTrigger value="response">Response</TabsTrigger>
                      </TabsList>
                      <TabsContent
                        value="request"
                        className="gap-2 flex flex-col"
                      >
                        <SyntaxHighlighter
                          language="bash"
                          style={vscDarkPlus}
                          className="p-4 rounded-md overflow-auto text-sm"
                          wrapLines={true}
                          customStyle={{ margin: 0, background: "black" }}
                        >
                          POST /access/v1/search/resource
                        </SyntaxHighlighter>
                        <SyntaxHighlighter
                          language="json"
                          style={vscDarkPlus}
                          className="p-4 rounded-md overflow-auto text-sm"
                          wrapLines={true}
                          customStyle={{ margin: 0, background: "black" }}
                        >
                          {JSON.stringify(actionData.authZENRequest, null, 2)}
                        </SyntaxHighlighter>
                      </TabsContent>
                      <TabsContent value="response">
                        <SyntaxHighlighter
                          language="json"
                          style={vscDarkPlus}
                          className="p-4 rounded-md overflow-auto text-sm"
                          wrapLines={true}
                          customStyle={{ margin: 0, background: "black" }}
                        >
                          {JSON.stringify(actionData.authZENResponse, null, 2)}
                        </SyntaxHighlighter>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </Form>
      </CardContent>
    </Card>
  );
}
