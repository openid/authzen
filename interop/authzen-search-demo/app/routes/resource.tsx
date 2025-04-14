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
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { subjects } from "~/data/subjects.server";
import { pdps } from "~/data/pdps.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API - Resource Search" }];
}

export async function loader({}: Route.LoaderArgs) {
  return {
    subjects,
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

  const pdp = pdps.find((pdp) => pdp.name === cookie.selectedPdp);
  if (!pdp) {
    return {
      error: "PDP not found",
    };
  }

  const formData = await request.formData();
  const subject = formData.get("subject");
  const resource = formData.get("resource");
  const action = formData.get("action");
  const nextToken = formData.get("next_token") ?? "";

  if (!subject || subjects.find((s) => s.id === subject) === undefined) {
    return {
      error: "Invalid subject selected",
    };
  }

  const authZENRequest = {
    subject: {
      type: "user",
      id: subject,
    },
    action: {
      name: action,
    },
    resource: {
      type: resource,
    },
    context: {},
    page: {
      next_token: nextToken,
    },
  };

  try {
    // make AuthZEN API call to get resources for the subject

    // const headers = new Headers();
    // headers.append("Content-Type", "application/json");
    // if (pdp.auth) {
    //   headers.append("Authorization", pdp.auth);
    // }

    // const authZENResponse = await fetch(`${pdp.host}/access/v1/resource`, {
    //   method: "POST",
    //   headers,
    //   body: JSON.stringify(authZENRequest),
    // }).then((res) => res.json());

    // this is a mock response

    const authZENResponse = {
      results: [
        {
          type: "record",
          id: "123",
        },
        {
          type: "record",
          id: "456",
        },
        {
          type: "record",
          id: "678",
        },
        {
          type: "record",
          id: "231",
        },
      ],
      page: {
        next_token: "abc123",
      },
    };
    return {
      authZENRequest,
      authZENResponse,
    };
  } catch (error) {
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
          Select a subject and action to get the resources it would be allowed
          upon
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="post" className="flex flex-col gap-4">
          <div className="mb-6 flex gap-4 items-center">
            <p className="font-semibold text-sm">Subject</p>
            <Select name="subject">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {loaderData.subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="font-semibold text-sm">Resource type</p>
            <Select name="action" defaultValue="can_read">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select an resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="can_read">record</SelectItem>
              </SelectContent>
            </Select>
            <p className="font-semibold text-sm">Action</p>
            <Select name="action" defaultValue="can_read">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="can_read">can_read</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="next_token"
              value={actionData?.authZENResponse?.page?.next_token}
            />
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
                      <TableHead>Resource ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionData.authZENResponse.results?.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">
                          {resource.id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {actionData.authZENResponse.page.next_token !== "" && (
                  <Button variant="outline" className="mt-4">
                    View More
                  </Button>
                )}
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
                          POST /access/v1/resource
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
