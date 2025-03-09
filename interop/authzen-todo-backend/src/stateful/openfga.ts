import { StatefulAuthorizationService } from "interfaces";

export class OpenFGAStatefulAuthorizationService implements StatefulAuthorizationService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async makeRequest(body: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/write`, {
        method: "POST",
        headers: {
          Authorization: this.apiKey,
          "Content-Type": "application/json",
        },
        body: body
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenFGA request failed: ${response.statusText}. Response: ${errorBody}`);
      }
    } catch (error) {
      console.error('OpenFGA request failed:', error);
      throw new Error('Failed to update authorization state');
    }
  }

  async insert(todoId: string, userId: string): Promise<void> {
    await this.makeRequest(JSON.stringify({
        "writes": {
          "tuple_keys": [
            {
              "user": `user:${userId}`,
              "relation": "owner",
              "object": `todo:${todoId}`,
            },
            {
              "user": `todo:todo-1`,
              "relation": "parent",
              "object": `todo:${todoId}`,
            }
          ]
        }
      }))
  }

  async delete(todoId: string, userId: string): Promise<void> {
    await this.makeRequest(JSON.stringify({
        "deletes": {
          "tuple_keys": [
            {
              "user": `user:${userId}`,
              "relation": "owner",
              "object": `todo:${todoId}`,
            },
            {
              "user": `todo:todo-1`,
              "relation": "parent",
              "object": `todo:${todoId}`,
            }
          ]
        }
      }))
  }

}
