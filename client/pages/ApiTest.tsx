import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiTest() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult("");
    
    try {
      // Test basic connection
      const response = await apiClient.get("/health");
      setResult(`✅ Connection successful!\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setResult(`❌ Network Error: Cannot connect to localhost:5000\n\nPossible issues:\n1. Backend server is not running\n2. Backend is running on different port\n3. CORS not configured properly`);
      } else {
        setResult(`❌ Error: ${error.message}\n${JSON.stringify(error.response?.data || {}, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setResult("");
    
    try {
      // Test auth endpoint
      const response = await apiClient.post("/auth/login", {
        email: "test@example.com",
        password: "testpassword"
      });
      setResult(`✅ Auth endpoint reachable!\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setResult(`❌ Network Error: Cannot connect to localhost:5000`);
      } else if (error.response?.status === 400 || error.response?.status === 401) {
        setResult(`✅ Auth endpoint reachable! (Got expected error for invalid credentials)\n${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        setResult(`❌ Error: ${error.message}\n${JSON.stringify(error.response?.data || {}, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testConnection} disabled={loading}>
              Test Health Endpoint
            </Button>
            <Button onClick={testAuth} disabled={loading}>
              Test Auth Endpoint
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Current API Base URL: <code>http://localhost:5000/api/v1</code>
          </div>
          
          {result && (
            <pre className="bg-muted p-4 rounded-md text-sm overflow-auto whitespace-pre-wrap">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}