'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DcNumber {
  id: number;
  dc_number: string;
  part_codes: string[];
  created_at: string;
  updated_at: string;
}

interface PartCode {
  id: number;
  part_code: string;
  description: string;
  dc_number_id: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dcNumbers, setDcNumbers] = useState<DcNumber[]>([]);
  const [partCodes, setPartCodes] = useState<PartCode[]>([]);
  const [newDcNumber, setNewDcNumber] = useState('');
  const [newPartCode, setNewPartCode] = useState('');
  const [selectedDcNumber, setSelectedDcNumber] = useState<number | null>(null);
  const [editingDcNumber, setEditingDcNumber] = useState<DcNumber | null>(null);
  const [editingPartCode, setEditingPartCode] = useState<PartCode | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (!loading && user) {
      if (user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  // Load DC Numbers and PartCodes
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadDcNumbers();
    }
  }, [user]);

  const loadDcNumbers = async () => {
    try {
      const response = await fetch('/api/admin/dc-numbers');
      if (response.ok) {
        const data = await response.json();
        setDcNumbers(data.dcNumbers || []);
      }
    } catch (error) {
      console.error('Error loading DC Numbers:', error);
    }
  };

  const handleCreateDcNumber = async () => {
    if (!newDcNumber.trim()) {
      setError('DC Number is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/dc-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dcNumber: newDcNumber.trim() }),
      });

      if (response.ok) {
        setSuccess('DC Number created successfully');
        setNewDcNumber('');
        loadDcNumbers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create DC Number');
      }
    } catch (error) {
      setError('Failed to create DC Number');
    }
  };

  const handleDeleteDcNumber = async (id: number) => {
    if (!confirm('Are you sure you want to delete this DC Number?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/dc-numbers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('DC Number deleted successfully');
        loadDcNumbers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete DC Number');
      }
    } catch (error) {
      setError('Failed to delete DC Number');
    }
  };

  const handleAddPartCode = async () => {
    if (!selectedDcNumber || !newPartCode.trim()) {
      setError('Please select a DC Number and enter a Part Code');
      return;
    }

    try {
      const response = await fetch('/api/admin/part-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dcNumberId: selectedDcNumber,
          partCode: newPartCode.trim()
        }),
      });

      if (response.ok) {
        setSuccess('Part Code added successfully');
        setNewPartCode('');
        loadDcNumbers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add Part Code');
      }
    } catch (error) {
      setError('Failed to add Part Code');
    }
  };

  const handleDeletePartCode = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Part Code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/part-codes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Part Code deleted successfully');
        loadDcNumbers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete Part Code');
      }
    } catch (error) {
      setError('Failed to delete Part Code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Access denied. Admin access required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* DC Numbers Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">DC Numbers Management</h2>
          
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={newDcNumber}
              onChange={(e) => setNewDcNumber(e.target.value)}
              placeholder="Enter new DC Number"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleCreateDcNumber}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add DC Number
            </button>
          </div>

          <div className="space-y-4">
            {dcNumbers.map((dc) => (
              <div key={dc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">{dc.dc_number}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteDcNumber(dc.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Part Code to {dc.dc_number}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPartCode}
                      onChange={(e) => setNewPartCode(e.target.value)}
                      placeholder="Enter Part Code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        setSelectedDcNumber(dc.id);
                        handleAddPartCode();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Add Part Code
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Part Codes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {dc.part_codes && dc.part_codes.length > 0 ? (
                      dc.part_codes.map((partCode, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {partCode}
                          <button
                            onClick={() => handleDeletePartCode(dc.id)} // Simplified for now
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No part codes assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}