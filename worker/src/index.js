/**
 * Boss Booker - Cloudflare Worker API
 * Handles contact submissions, service requests, and admin portal data
 */

// Helper function to create CORS headers
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Helper function to create JSON response with CORS
function jsonResponse(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request)
    }
  });
}

// Verify admin authentication
async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'No authorization header' };
  }

  const token = authHeader.substring(7);
  
  // Check if token matches the admin password
  if (token !== env.ADMIN_PASSWORD) {
    return { valid: false, error: 'Invalid credentials' };
  }

  return { valid: true };
}

// Generate unique ID
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request)
      });
    }

    try {
      // Public endpoints
      if (path === '/api/contact' && request.method === 'POST') {
        return await handleContactSubmission(request, env);
      }

      if (path === '/api/request' && request.method === 'POST') {
        return await handleServiceRequest(request, env);
      }

      // Admin authentication endpoint
      if (path === '/api/admin/auth' && request.method === 'POST') {
        return await handleAdminAuth(request, env);
      }

      // Protected admin endpoints
      const authResult = await verifyAuth(request, env);
      if (!authResult.valid) {
        return jsonResponse({ error: 'Unauthorized', message: authResult.error }, 401, request);
      }

      if (path === '/api/admin/contacts' && request.method === 'GET') {
        return await getContacts(request, env);
      }

      if (path === '/api/admin/requests' && request.method === 'GET') {
        return await getRequests(request, env);
      }

      if (path === '/api/admin/clients' && request.method === 'GET') {
        return await getClients(request, env);
      }

      if (path.startsWith('/api/admin/contact/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        return await deleteContact(id, request, env);
      }

      if (path.startsWith('/api/admin/request/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        return await deleteRequest(id, request, env);
      }

      if (path.startsWith('/api/admin/client/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        return await deleteClient(id, request, env);
      }

      if (path === '/api/admin/contact/accept' && request.method === 'POST') {
        return await acceptContact(request, env);
      }

      if (path === '/api/admin/request/accept' && request.method === 'POST') {
        return await acceptRequest(request, env);
      }

      // Not found
      return jsonResponse({ error: 'Not found' }, 404, request);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error', message: error.message }, 500, request);
    }
  }
};

// Handle contact form submission
async function handleContactSubmission(request, env) {
  try {
    const data = await request.json();
    
    const contact = {
      id: generateId('contact'),
      name: data.name,
      email: data.email,
      company: data.company || '',
      phone: data.phone || '',
      message: data.message || '',
      timestamp: Date.now(),
      status: 'new'
    };

    // Store in KV
    await env.BOSSBOOKER_KV.put(`contact:${contact.id}`, JSON.stringify(contact));
    
    // Add to contacts index
    const indexKey = 'index:contacts';
    let index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    index.unshift(contact.id);
    await env.BOSSBOOKER_KV.put(indexKey, JSON.stringify(index));

    return jsonResponse({ success: true, id: contact.id }, 200, request);
  } catch (error) {
    console.error('Error handling contact submission:', error);
    return jsonResponse({ error: 'Failed to save contact', message: error.message }, 500, request);
  }
}

// Handle service request submission
async function handleServiceRequest(request, env) {
  try {
    const data = await request.json();
    
    const serviceRequest = {
      id: generateId('request'),
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      companySize: data.companySize || '',
      address: data.address || '',
      notes: data.notes || '',
      planName: data.planName,
      monthlyTotal: data.monthlyTotal,
      setupFee: data.setupFee,
      firstMonthTotal: data.firstMonthTotal,
      timestamp: Date.now(),
      status: 'new'
    };

    // Store in KV
    await env.BOSSBOOKER_KV.put(`request:${serviceRequest.id}`, JSON.stringify(serviceRequest));
    
    // Add to requests index
    const indexKey = 'index:requests';
    let index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    index.unshift(serviceRequest.id);
    await env.BOSSBOOKER_KV.put(indexKey, JSON.stringify(index));

    return jsonResponse({ success: true, id: serviceRequest.id }, 200, request);
  } catch (error) {
    console.error('Error handling service request:', error);
    return jsonResponse({ error: 'Failed to save request', message: error.message }, 500, request);
  }
}

// Admin authentication
async function handleAdminAuth(request, env) {
  try {
    const data = await request.json();
    const { password } = data;

    if (password === env.ADMIN_PASSWORD) {
      // Return a token (in production, use JWT or similar)
      return jsonResponse({ 
        success: true, 
        token: env.ADMIN_PASSWORD // In production, generate a proper JWT token
      }, 200, request);
    }

    return jsonResponse({ error: 'Invalid password' }, 401, request);
  } catch (error) {
    return jsonResponse({ error: 'Authentication failed', message: error.message }, 500, request);
  }
}

// Get all contacts
async function getContacts(request, env) {
  try {
    const indexKey = 'index:contacts';
    const index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    
    const contacts = [];
    for (const id of index) {
      const contact = await env.BOSSBOOKER_KV.get(`contact:${id}`, 'json');
      if (contact) {
        contacts.push(contact);
      }
    }

    return jsonResponse(contacts, 200, request);
  } catch (error) {
    console.error('Error getting contacts:', error);
    return jsonResponse({ error: 'Failed to get contacts', message: error.message }, 500, request);
  }
}

// Get all service requests
async function getRequests(request, env) {
  try {
    const indexKey = 'index:requests';
    const index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    
    const requests = [];
    for (const id of index) {
      const serviceRequest = await env.BOSSBOOKER_KV.get(`request:${id}`, 'json');
      if (serviceRequest) {
        requests.push(serviceRequest);
      }
    }

    return jsonResponse(requests, 200, request);
  } catch (error) {
    console.error('Error getting requests:', error);
    return jsonResponse({ error: 'Failed to get requests', message: error.message }, 500, request);
  }
}

// Get all clients
async function getClients(request, env) {
  try {
    const indexKey = 'index:clients';
    const index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    
    const clients = [];
    for (const id of index) {
      const client = await env.BOSSBOOKER_KV.get(`client:${id}`, 'json');
      if (client) {
        clients.push(client);
      }
    }

    return jsonResponse(clients, 200, request);
  } catch (error) {
    console.error('Error getting clients:', error);
    return jsonResponse({ error: 'Failed to get clients', message: error.message }, 500, request);
  }
}

// Delete contact
async function deleteContact(id, request, env) {
  try {
    await env.BOSSBOOKER_KV.delete(`contact:${id}`);
    
    // Remove from index
    const indexKey = 'index:contacts';
    let index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    index = index.filter(contactId => contactId !== id);
    await env.BOSSBOOKER_KV.put(indexKey, JSON.stringify(index));

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    return jsonResponse({ error: 'Failed to delete contact', message: error.message }, 500, request);
  }
}

// Delete request
async function deleteRequest(id, request, env) {
  try {
    await env.BOSSBOOKER_KV.delete(`request:${id}`);
    
    // Remove from index
    const indexKey = 'index:requests';
    let index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    index = index.filter(requestId => requestId !== id);
    await env.BOSSBOOKER_KV.put(indexKey, JSON.stringify(index));

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    return jsonResponse({ error: 'Failed to delete request', message: error.message }, 500, request);
  }
}

// Delete client
async function deleteClient(id, request, env) {
  try {
    await env.BOSSBOOKER_KV.delete(`client:${id}`);
    
    // Remove from index
    const indexKey = 'index:clients';
    let index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    index = index.filter(clientId => clientId !== id);
    await env.BOSSBOOKER_KV.put(indexKey, JSON.stringify(index));

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    return jsonResponse({ error: 'Failed to delete client', message: error.message }, 500, request);
  }
}

// Accept contact and convert to client
async function acceptContact(request, env) {
  try {
    const { id } = await request.json();
    
    const contact = await env.BOSSBOOKER_KV.get(`contact:${id}`, 'json');
    if (!contact) {
      return jsonResponse({ error: 'Contact not found' }, 404, request);
    }

    // Update contact status
    contact.status = 'accepted';
    await env.BOSSBOOKER_KV.put(`contact:${id}`, JSON.stringify(contact));

    // Create client
    const client = {
      id: generateId('client'),
      name: contact.name,
      company: contact.company || '',
      email: contact.email,
      phone: contact.phone || '',
      acceptedDate: Date.now(),
      originalSubmission: contact.timestamp,
      source: 'contact_form'
    };

    await env.BOSSBOOKER_KV.put(`client:${client.id}`, JSON.stringify(client));
    
    // Add to clients index
    const indexKey = 'index:clients';
    let index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    index.unshift(client.id);
    await env.BOSSBOOKER_KV.put(indexKey, JSON.stringify(index));

    return jsonResponse({ success: true, client }, 200, request);
  } catch (error) {
    return jsonResponse({ error: 'Failed to accept contact', message: error.message }, 500, request);
  }
}

// Accept service request and convert to client
async function acceptRequest(request, env) {
  try {
    const { id } = await request.json();
    
    const serviceRequest = await env.BOSSBOOKER_KV.get(`request:${id}`, 'json');
    if (!serviceRequest) {
      return jsonResponse({ error: 'Request not found' }, 404, request);
    }

    // Update request status
    serviceRequest.status = 'accepted';
    await env.BOSSBOOKER_KV.put(`request:${id}`, JSON.stringify(serviceRequest));

    // Create client
    const client = {
      id: generateId('client'),
      name: serviceRequest.contactName,
      company: serviceRequest.companyName,
      email: serviceRequest.email,
      phone: serviceRequest.phone,
      address: serviceRequest.address || '',
      plan: serviceRequest.planName,
      monthlyValue: serviceRequest.monthlyTotal,
      acceptedDate: Date.now(),
      originalSubmission: serviceRequest.timestamp,
      source: 'service_request'
    };

    await env.BOSSBOOKER_KV.put(`client:${client.id}`, JSON.stringify(client));
    
    // Add to clients index
    const indexKey = 'index:clients';
    let index = await env.BOSSBOOKER_KV.get(indexKey, 'json') || [];
    index.unshift(client.id);
    await env.BOSSBOOKER_KV.put(indexKey, JSON.stringify(index));

    return jsonResponse({ success: true, client }, 200, request);
  } catch (error) {
    return jsonResponse({ error: 'Failed to accept request', message: error.message }, 500, request);
  }
}
