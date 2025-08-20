
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';

export const NodeInspector: React.FC = () => {
  const { 
    selectedNode, 
    updateNode, 
    deleteNode, 
    executionResults,
    setSelectedNode,
    edges
  } = useWorkflowStore();
  
  const [showDataMappings, setShowDataMappings] = useState(false);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-border bg-card p-4">
        <div className="text-center text-muted-foreground mt-8">
          Select a node to edit its properties
        </div>
      </div>
    );
  }

  const handleConfigChange = (key: string, value: any) => {
    updateNode(selectedNode.id, {
      config: { ...selectedNode.data.config, [key]: value }
    });
  };

  const handleLabelChange = (label: string) => {
    updateNode(selectedNode.id, { label });
  };

  const handleDelete = () => {
    deleteNode(selectedNode.id);
    setSelectedNode(null);
  };

  // Get connected input nodes and their execution results
  const getConnectedInputNodes = () => {
    const connectedEdges = edges.filter(edge => edge.target === selectedNode.id);
    return connectedEdges.map(edge => {
      const result = executionResults[edge.source];
      return {
        nodeId: edge.source,
        result: result
      };
    }).filter(node => node.result);
  };

  const connectedNodes = getConnectedInputNodes();

  const renderDataSelector = (data: any, path: string = '', nodeId: string) => {
    if (!data || typeof data !== 'object') return null;
    
    return Object.keys(data).map(key => {
      const fullPath = path ? `${path}.${key}` : key;
      const value = data[key];
      const isObject = value && typeof value === 'object' && !Array.isArray(value);
      const isArray = Array.isArray(value);
      
      return (
        <div key={fullPath} className="ml-2">
          <div className="flex items-center gap-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                const currentMappings = selectedNode.data.config.inputMappings || [];
                const existingIndex = currentMappings.findIndex((m: any) => m.sourceNode === nodeId && m.sourcePath === fullPath);
                
                if (existingIndex >= 0) {
                  // Remove mapping
                  const newMappings = currentMappings.filter((_: any, i: number) => i !== existingIndex);
                  handleConfigChange('inputMappings', newMappings);
                } else {
                  // Add mapping
                  const newMapping = {
                    sourceNode: nodeId,
                    sourcePath: fullPath,
                    targetPath: fullPath.split('.').pop() // Use last part as target field name
                  };
                  handleConfigChange('inputMappings', [...currentMappings, newMapping]);
                }
              }}
            >
              {(selectedNode.data.config.inputMappings || []).some((m: any) => 
                m.sourceNode === nodeId && m.sourcePath === fullPath
              ) ? '✓' : '+'}
            </Button>
            <span className="text-xs font-mono">{key}</span>
            <span className="text-xs text-muted-foreground">
              {isArray ? `[${value.length}]` : isObject ? '{...}' : String(value).substring(0, 20)}
            </span>
          </div>
          {isObject && renderDataSelector(value, fullPath, nodeId)}
        </div>
      );
    });
  };

  const renderDataMappingSection = () => {
    if (connectedNodes.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No input data available. Connect nodes to see data mappings.
        </div>
      );
    }

    const selectedMappings = selectedNode.data.config.inputMappings || [];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDataMappings(!showDataMappings)}
            className="p-1 h-6"
          >
            {showDataMappings ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <Label className="text-sm font-medium">Data Mapping</Label>
          {selectedMappings.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
              {selectedMappings.length} mapped
            </span>
          )}
        </div>
        
        {selectedMappings.length > 0 && (
          <div className="space-y-1 text-xs">
            <Label className="text-xs font-medium">Selected Fields:</Label>
            {selectedMappings.map((mapping: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span className="font-mono">{mapping.sourcePath}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => {
                    const newMappings = selectedMappings.filter((_: any, i: number) => i !== index);
                    handleConfigChange('inputMappings', newMappings);
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {showDataMappings && (
          <div className="space-y-2 pl-4 max-h-60 overflow-y-auto">
            {connectedNodes.map((node) => (
              <div key={node.nodeId} className="border rounded p-2 bg-muted/50">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  From Node: {node.nodeId}
                </div>
                <div className="space-y-1">
                  {renderDataSelector(node.result.data || node.result, '', node.nodeId)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNodeConfig = () => {
    switch (selectedNode.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={selectedNode.data.config.method || 'GET'}
                onValueChange={(value) => handleConfigChange('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                value={selectedNode.data.config.path || ''}
                onChange={(e) => handleConfigChange('path', e.target.value)}
                placeholder="/webhook"
              />
            </div>
          </div>
        );

      case 'function':
        return (
          <div className="space-y-4">
            {renderDataMappingSection()}
            <div>
              <Label htmlFor="code">JavaScript Code</Label>
              <Textarea
                id="code"
                value={selectedNode.data.config.code || ''}
                onChange={(e) => handleConfigChange('code', e.target.value)}
                placeholder="// Access input data with 'input' parameter
// Example: return { result: input.data.someField * 2 };
return { processed: input };"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-4">
            {renderDataMappingSection()}
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={selectedNode.data.config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
            <div>
              <Label htmlFor="api-method">Method</Label>
              <Select
                value={selectedNode.data.config.method || 'GET'}
                onValueChange={(value) => handleConfigChange('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={selectedNode.data.config.headers || '{}'}
                onChange={(e) => handleConfigChange('headers', e.target.value)}
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="body-template">Request Body Template (JSON)</Label>
              <Textarea
                id="body-template"
                value={selectedNode.data.config.bodyTemplate || ''}
                onChange={(e) => handleConfigChange('bodyTemplate', e.target.value)}
                placeholder='Use input data: {"name": "{{input.data.name}}", "email": "{{input.data.email}}"}'
                rows={4}
                className="font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Use {`{{input.path.to.data}}`} to reference input data dynamically
              </div>
            </div>
          </div>
        );

      case 'utility':
        return (
          <div className="space-y-4">
            {renderDataMappingSection()}
            <div>
              <Label htmlFor="operation">Operation</Label>
              <Input
                id="operation"
                value={selectedNode.data.config.operation || ''}
                onChange={(e) => handleConfigChange('operation', e.target.value)}
                placeholder="e.g., filter, transform, delay"
              />
            </div>
            <div>
              <Label htmlFor="parameters">Parameters (JSON)</Label>
              <Textarea
                id="parameters"
                value={selectedNode.data.config.parameters || '{}'}
                onChange={(e) => handleConfigChange('parameters', e.target.value)}
                placeholder='{"key": "value"}'
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'llm':
        return (
          <div className="space-y-4">
            {renderDataMappingSection()}
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={selectedNode.data.config.prompt || ''}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                placeholder="Process the following data: {{input.data}}
                
Analyze and provide insights..."
                rows={4}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Use {`{{input.path.to.data}}`} to reference input data in your prompt
              </div>
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Select
                value={selectedNode.data.config.model || 'gemini-1.5-flash'}
                onValueChange={(value) => handleConfigChange('model', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const nodeResult = executionResults[selectedNode.id];

  return (
    <div className="w-80 border-l border-border bg-card p-4 space-y-4 overflow-y-auto">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Node Properties</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={selectedNode.data.label}
              onChange={(e) => handleLabelChange(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Type</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm capitalize">
              {selectedNode.type}
            </div>
          </div>

          {renderNodeConfig()}
        </CardContent>
      </Card>

      {nodeResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Execution Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
              {JSON.stringify(nodeResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
