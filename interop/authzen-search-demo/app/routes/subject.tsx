import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Route } from "./+types/subject";
import { Form, useNavigation } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { records } from "~/data/records.server";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { Code } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";
import { pdpCookie } from "~/cookies.server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { subjectResponse } from "~/lib/schema";
import { callPdp } from "~/lib/callPdp";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API - Subject Search" }];
}

export async function loader({}: Route.LoaderArgs) {
  return {
    records,
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
  const subjectType = formData.get("subjectType");
  const resource = formData.get("resource");
  const resourceId = formData.get("resourceId");
  const action = formData.get("action");

  const authZENRequest = {
    subject: {
      type: subjectType,
    },
    action: {
      name: action,
    },
    resource: {
      type: resource,
      id: resourceId,
    },
    context: {},
  };

  try {
    const response = await callPdp(
      "/access/v1/search/subject",
      authZENRequest,
      cookie.selectedPdp
    );

    const authZENResponse = subjectResponse.parse(response);

    return {
      authZENRequest,
      authZENResponse,
    };
  } catch (error) {
    console.error("Error fetching data from PDP", error);
    return {
      error: "Error fetching data from PDP",
    };
  }
}

export default function SubjectSearch({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Search</CardTitle>
        <CardDescription>
          Select a resource and action to get the subjects which can perform the
          action
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="post" className="flex flex-col gap-4">
          <div className="mb-6 flex gap-4 items-center">
            <p className="font-semibold text-sm">Subject type</p>
            <Select name="subjectType" defaultValue={"user"}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a subject type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">user</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="resource" value="record" />
            <p className="font-semibold text-sm">Resource ID</p>
            <Select
              name="resourceId"
              defaultValue={loaderData.records[0].id + ""}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a record" />
              </SelectTrigger>
              <SelectContent>
                {loaderData.records.map((record) => (
                  <SelectItem key={record.id} value={record.id + ""}>
                    {record.id}
                  </SelectItem>
                ))}
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
                      <TableHead>Subject ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionData.authZENResponse.results?.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">
                          {subject.id}
                        </TableCell>
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
                          POST /access/v1/search/subject
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
