import { create } from 'zustand';
import { Node, Edge, Connection, addEdge } from '@xyflow/react';

export interface WorkflowNode extends Node {
  type: 'trigger' | 'function' | 'api' | 'utility' | 'llm';
  data: {
    label: string;
    config: Record<string, any>;
  };
}

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNode: WorkflowNode | null;
  isExecuting: boolean;
  executionResults: Record<string, any>;
}

export interface WorkflowActions {
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: WorkflowNode) => void;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (node: WorkflowNode | null) => void;
  executeWorkflow: () => Promise<void>;
  clearExecution: () => void;
}

export type WorkflowStore = WorkflowState & WorkflowActions;

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // State
  nodes: [],
  edges: [],
  selectedNode: null,
  isExecuting: false,
  executionResults: {},

  // Actions
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  addNode: (node) => set((state) => ({ 
    nodes: [...state.nodes, node] 
  })),
  
  deleteNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== nodeId),
    edges: state.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode
  })),
  
  updateNode: (nodeId, data) => set((state) => {
    const updatedNodes = state.nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...data } }
        : node
    );
    
    // Also update selectedNode if it's the same node being updated
    const updatedSelectedNode = state.selectedNode?.id === nodeId 
      ? updatedNodes.find(n => n.id === nodeId) as WorkflowNode
      : state.selectedNode;
    
    return {
      nodes: updatedNodes,
      selectedNode: updatedSelectedNode
    };
  }),
  
  onConnect: (connection) => set((state) => ({
    edges: addEdge(connection, state.edges)
  })),
  
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  executeWorkflow: async () => {
    console.log('🚀 Starting workflow execution...');
    set({ isExecuting: true, executionResults: {} });
    
    const { nodes, edges } = get();
    const results: Record<string, any> = {};
    
    console.log('📊 Workflow state:', { 
      nodeCount: nodes.length, 
      edgeCount: edges.length 
    });
    
    if (nodes.length === 0) {
      console.error('❌ No nodes found in workflow');
      set({ isExecuting: false });
      return;
    }
    
    try {
      // Find trigger nodes and execute in sequence
      const triggerNodes = nodes.filter(n => n.type === 'trigger');
      
      console.log('🎯 Found trigger nodes:', triggerNodes.length);
      
      if (triggerNodes.length === 0) {
        // If no trigger nodes, start with first node
        console.log('⚡ No trigger nodes found, starting with first node');
        await executeNodeChain(nodes[0], nodes, edges, results);
      } else {
        for (const triggerNode of triggerNodes) {
          console.log('🔥 Executing trigger node:', triggerNode.id);
          await executeNodeChain(triggerNode, nodes, edges, results);
        }
      }
      
      console.log('✅ Workflow execution completed:', results);
      set({ executionResults: results });
    } catch (error) {
      console.error('💥 Workflow execution failed:', error);
      set({ executionResults: { error: error.message } });
    } finally {
      set({ isExecuting: false });
    }
  },
  
  clearExecution: () => set({ executionResults: {} })
}));

// Helper function to process templates with input data
function processTemplate(template: string, inputData: any): string {
  if (!template || typeof template !== 'string') return template;
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    try {
      // Remove any whitespace from the path
      const cleanPath = path.trim();
      
      // Navigate the object path (e.g., "input.data.name")
      const value = cleanPath.split('.').reduce((obj, key) => {
        return obj && obj[key] !== undefined ? obj[key] : undefined;
      }, { input: inputData });
      
      return value !== undefined ? String(value) : match;
    } catch (error) {
      console.warn(`Template processing error for ${path}:`, error);
      return match;
    }
  });
}

// Helper function to execute a chain of nodes
async function executeNodeChain(
  startNode: WorkflowNode, 
  allNodes: WorkflowNode[], 
  edges: Edge[], 
  results: Record<string, any>
): Promise<void> {
  const visited = new Set<string>();
  
  async function executeNode(node: WorkflowNode, input?: any): Promise<any> {
    if (visited.has(node.id)) {
      console.log(`🔄 Node ${node.id} already visited, returning cached result`);
      return results[node.id];
    }
    
    visited.add(node.id);
    console.log(`🎬 Executing ${node.type} node: ${node.id} (${node.data.label})`);
    console.log(`📥 Input data:`, input);
    
    let output;
    
    switch (node.type) {
      case 'trigger':
        // For trigger nodes with HTTP webhook URL
        try {
          const triggerUrl = `https://armblanzbowvppzyvqad.supabase.co/functions/v1/http-trigger?triggerNodeId=${node.id}`;
          console.log(`🌐 Calling HTTP trigger: ${triggerUrl}`);
          
          const response = await fetch(triggerUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              triggerNodeId: node.id,
              timestamp: new Date().toISOString(),
              simulatedData: { message: 'Workflow triggered', source: 'workflow-builder' }
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP trigger failed: ${response.status}`);
          }
          
          output = await response.json();
          console.log(`✅ Trigger response:`, output);
        } catch (error) {
          console.error(`❌ Trigger failed:`, error);
          output = {
            success: false,
            error: `Trigger failed: ${error.message}`
          };
        }
        break;
        
      case 'function':
        try {
          // Get input data from previous nodes with mappings
          const inputData = getPreviousNodeData(node.id, results, node.data.config.inputMappings);
          console.log(`🔧 Function input:`, inputData);
          
          const fn = new Function('input', node.data.config.code || 'return input;');
          const functionResult = fn(inputData);
          
          output = {
            success: true,
            data: functionResult,
            inputData: inputData
          };
          console.log(`✅ Function result:`, output);
        } catch (error) {
          console.error(`❌ Function failed:`, error);
          output = {
            success: false,
            error: error.message
          };
        }
        break;
        
      case 'api':
        // Enhanced API call with dynamic template processing
        try {
          const url = node.data.config.url || 'https://jsonplaceholder.typicode.com/posts/1';
          const method = node.data.config.method || 'GET';
          
          // Get input data from connected nodes with mappings  
          const inputData = getPreviousNodeData(node.id, results, node.data.config.inputMappings);
          console.log(`🌐 Making ${method} request to: ${url}`);
          console.log(`📤 API input data:`, inputData);
          
          const fetchConfig: RequestInit = {
            method,
            headers: {},
          };
          
          // Process headers template
          let headers = {};
          try {
            const headersStr = node.data.config.headers || '{}';
            const processedHeaders = processTemplate(headersStr, inputData);
            headers = JSON.parse(processedHeaders);
          } catch (error) {
            console.warn('Header parsing error:', error);
          }
          
          // Set headers
          Object.assign(fetchConfig.headers, headers);
          
          // Process body template if provided
          let bodyData = null;
          if (method !== 'GET') {
            if (node.data.config.bodyTemplate) {
              try {
                const processedTemplate = processTemplate(node.data.config.bodyTemplate, inputData);
                bodyData = JSON.parse(processedTemplate);
                console.log(`📦 Using template body:`, bodyData);
              } catch (error) {
                console.warn('Body template processing error:', error);
                bodyData = inputData;
              }
            } else if (inputData && Object.keys(inputData).length > 0) {
              bodyData = inputData;
              console.log(`📦 Using input data as body:`, bodyData);
            }
            
            if (bodyData) {
              fetchConfig.headers['Content-Type'] = 'application/json';
              fetchConfig.body = JSON.stringify(bodyData);
            }
          }
          
          console.log(`🔧 Request config:`, fetchConfig);
          
          const response = await fetch(url, fetchConfig);
          
          console.log(`📊 Response status:`, response.status);
          console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Response error text:`, errorText);
            throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          const responseText = await response.text();
          console.log(`📄 Raw response:`, responseText);
          
          let data;
          try {
            data = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.log(`⚠️ Response is not JSON, treating as text:`, responseText);
            data = responseText;
          }
          
          output = {
            success: true,
            data: data,
            inputData: inputData,
            statusCode: response.status
          };
          console.log(`✅ API response:`, output);
        } catch (error) {
          console.error(`❌ API call failed:`, error);
          output = {
            success: false,
            error: `API call failed: ${error.message}`,
            url: node.data.config.url,
            method: node.data.config.method
          };
        }
        break;
        
      case 'utility':
        // Utility operation with input data processing
        try {
          const operation = node.data.config.operation || 'transform';
          const parameters = node.data.config.parameters || '{}';
          const inputData = getPreviousNodeData(node.id, results, node.data.config.inputMappings);
          
          console.log(`🔧 Utility operation: ${operation}`);
          console.log(`⚙️ Parameters:`, parameters);
          
          output = {
            success: true,
            data: {
              operation: operation,
              parameters: JSON.parse(parameters),
              inputData: inputData,
              result: `Utility operation '${operation}' completed successfully`
            }
          };
          console.log(`✅ Utility result:`, output);
        } catch (error) {
          console.error(`❌ Utility failed:`, error);
          output = {
            success: false,
            error: error.message
          };
        }
        break;
      
      case 'llm':
        // Enhanced LLM processing with template support
        try {
          const promptTemplate = node.data.config.prompt || 'Process this data';
          const model = node.data.config.model || 'gemini-1.5-flash';
          const inputData = getPreviousNodeData(node.id, results, node.data.config.inputMappings);
          
          // Process prompt template with input data
          const processedPrompt = processTemplate(promptTemplate, inputData);
          
          console.log(`🧠 Processing with LLM: ${model}`);
          console.log(`💬 Original prompt template:`, promptTemplate);
          console.log(`💬 Processed prompt:`, processedPrompt);
          
          const response = await fetch('https://armblanzbowvppzyvqad.supabase.co/functions/v1/llm-processor', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputData: inputData,
              prompt: processedPrompt,
              model: model
            })
          });
          
          if (!response.ok) {
            throw new Error(`LLM processing failed: ${response.status} ${response.statusText}`);
          }
          
          output = await response.json();
          console.log(`✅ LLM result:`, output);
        } catch (error) {
          console.error(`❌ LLM processing failed:`, error);
          output = {
            success: false,
            error: `LLM processing failed: ${error.message}`
          };
        }
        break;
        
      default:
        console.log(`⚠️ Unknown node type: ${node.type}`);
        output = input;
    }
    
    console.log(`📋 Storing result for node ${node.id}:`, output);
    results[node.id] = output;
    
    // Find and execute connected nodes
    const outgoingEdges = edges.filter(e => e.source === node.id);
    console.log(`🔗 Found ${outgoingEdges.length} outgoing connections from ${node.id}`);
    
    for (const edge of outgoingEdges) {
      const nextNode = allNodes.find(n => n.id === edge.target);
      if (nextNode) {
        console.log(`➡️ Executing next node: ${nextNode.id} (${nextNode.data.label})`);
        await executeNode(nextNode, output);
      }
    }
    
    return output;
  }
  
  await executeNode(startNode);
}

// Helper function to get data from previous nodes with input mappings support
function getPreviousNodeData(currentNodeId: string, results: Record<string, any>, inputMappings?: any[]) {
  const edges = useWorkflowStore.getState().edges;
  const connectedEdges = edges.filter(edge => edge.target === currentNodeId);
  
  if (connectedEdges.length === 0) {
    return {};
  }
  
  // If no input mappings specified, return full data (backward compatibility)
  if (!inputMappings || inputMappings.length === 0) {
    if (connectedEdges.length === 1) {
      // Single input - pass data directly
      const sourceResult = results[connectedEdges[0].source];
      return sourceResult?.data || sourceResult || {};
    }
    
    // Multiple inputs - combine them
    const combinedData: Record<string, any> = {};
    connectedEdges.forEach(edge => {
      const sourceResult = results[edge.source];
      const sourceData = sourceResult?.data || sourceResult;
      if (sourceData) {
        combinedData[edge.source] = sourceData;
      }
    });
    
    return combinedData;
  }
  
  // Use input mappings to build targeted data
  const mappedData: Record<string, any> = {};
  
  inputMappings.forEach(mapping => {
    const sourceResult = results[mapping.sourceNode];
    if (sourceResult) {
      const sourceData = sourceResult?.data || sourceResult;
      
      // Extract the value using the source path
      const value = mapping.sourcePath.split('.').reduce((obj: any, key: string) => {
        return obj && obj[key] !== undefined ? obj[key] : undefined;
      }, sourceData);
      
      if (value !== undefined) {
        // Set the value using the target path (or use source path as fallback)
        const targetPath = mapping.targetPath || mapping.sourcePath.split('.').pop();
        mappedData[targetPath] = value;
      }
    }
  });
  
  return Object.keys(mappedData).length > 0 ? mappedData : {};
}
