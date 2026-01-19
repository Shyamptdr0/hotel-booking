'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'

export default function TablesPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex h-full w-64 flex-col bg-gray-50 border-r flex-shrink-0">
          <Sidebar />
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />

          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                    <Plus className="h-8 w-8 text-orange-600" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon</h1>
                  <p className="text-lg text-gray-600 mb-8">Table management feature is under development</p>
                  <p className="text-gray-500 max-w-md mx-auto">
                    We're working on an amazing table management system that will help you organize your restaurant seating efficiently.
                  </p>
                </div>
                
                <div className="mt-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Table Management</h3>
                        <p className="text-sm text-gray-600">Organize and manage your restaurant tables</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Edit2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Easy Updates</h3>
                        <p className="text-sm text-gray-600">Quickly update table status and availability</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trash2 className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Full Control</h3>
                        <p className="text-sm text-gray-600">Complete control over your restaurant layout</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}


// COMMENTED CODE - PRESERVED FOR FUTURE USE
// This is the original tables implementation that can be restored later

// 'use client'

// import { useState, useEffect } from 'react'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Badge } from '@/components/ui/badge'
// import { AuthGuard } from '@/components/auth-guard'
// import { Sidebar } from '@/components/sidebar'
// import { Navbar } from '@/components/navbar'
// import { Plus, Edit2, Trash2, Users } from 'lucide-react'

// export default function TablesPage() {
//   const [tables, setTables] = useState([])
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false)
//   const [editingTable, setEditingTable] = useState(null)
//   const [formData, setFormData] = useState({
//     name: '',
//     capacity: '',
//     status: 'available'
//   })

//   useEffect(() => {
//     fetchTables()
//   }, [])

//   const fetchTables = async () => {
//     try {
//       const response = await fetch('/api/tables')
//       if (response.ok) {
//         const data = await response.json()
//         setTables(data)
//       }
//     } catch (error) {
//       console.error('Error fetching tables:', error)
//     }
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
    
//     const url = editingTable ? `/api/tables/${editingTable.id}` : '/api/tables'
//     const method = editingTable ? 'PUT' : 'POST'
    
//     try {
//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       })

//       if (response.ok) {
//         fetchTables()
//         setIsAddModalOpen(false)
//         setEditingTable(null)
//         setFormData({ name: '', capacity: '', status: 'available' })
//       }
//     } catch (error) {
//       console.error('Error saving table:', error)
//     }
//   }

//   const handleEdit = (table) => {
//     setEditingTable(table)
//     setFormData({
//       name: table.name,
//       capacity: table.capacity,
//       status: table.status
//     })
//     setIsAddModalOpen(true)
//   }

//   const handleDelete = async (id) => {
//     if (confirm('Are you sure you want to delete this table?')) {
//       try {
//         const response = await fetch(`/api/tables/${id}`, {
//           method: 'DELETE',
//         })

//         if (response.ok) {
//           fetchTables()
//         }
//       } catch (error) {
//         console.error('Error deleting table:', error)
//       }
//     }
//   }

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'blank':
//         return 'bg-gray-200 text-gray-800 border-gray-400'
//       case 'running':
//         return 'bg-blue-200 text-blue-800 border-blue-400'
//       case 'printed':
//         return 'bg-green-200 text-green-800 border-green-400'
//       case 'paid':
//         return 'bg-yellow-200 text-yellow-800 border-yellow-400'
//       case 'running_kot':
//         return 'bg-orange-200 text-orange-800 border-orange-400'
//       default:
//         return 'bg-gray-200 text-gray-800 border-gray-400'
//     }
//   }

//   // Sample table data with sections and statuses
//   const tableSections = [
//     {
//       name: 'Hole',
//       tables: [
//         { id: 1, name: 'Table 1', status: 'blank', capacity: 4 },
//         { id: 2, name: 'Table 2', status: 'running', capacity: 4 },
//         { id: 3, name: 'Table 3', status: 'printed', capacity: 2 },
//         { id: 4, name: 'Table 4', status: 'blank', capacity: 4 },
//         { id: 5, name: 'Table 5', status: 'paid', capacity: 6 },
//         { id: 6, name: 'Table 6', status: 'running_kot', capacity: 4 },
//         { id: 7, name: 'Table 7', status: 'blank', capacity: 4 },
//         { id: 8, name: 'Table 8', status: 'running', capacity: 2 },
//         { id: 9, name: 'Table 9', status: 'blank', capacity: 4 },
//         { id: 10, name: 'Table 10', status: 'printed', capacity: 6 },
//       ]
//     },
//     {
//       name: 'Seperate',
//       tables: [
//         { id: 11, name: 'Table 11', status: 'blank', capacity: 4 },
//         { id: 12, name: 'Table 12', status: 'running', capacity: 4 },
//       ]
//     },
//     {
//       name: 'Outside',
//       tables: [
//         { id: 13, name: 'S1', status: 'blank', capacity: 2 },
//         { id: 14, name: 'S2', status: 'running', capacity: 2 },
//         { id: 15, name: 'S3', status: 'blank', capacity: 4 },
//         { id: 16, name: 'S4', status: 'printed', capacity: 2 },
//         { id: 17, name: 'S5', status: 'paid', capacity: 6 },
//       ]
//     }
//   ]

//   return (
//     <AuthGuard>
//       <div className="flex h-screen bg-gray-100">
//         {/* Desktop Sidebar */
//         <div className="hidden lg:flex h-full w-64 flex-col bg-gray-50 border-r flex-shrink-0">
//           <Sidebar />
//         </div>

//         <div className="flex flex-1 flex-col min-w-0">
//           <Navbar />

//           <main className="flex-1 overflow-auto bg-gray-50">
//             <div className="p-6">
//               {/* Legend */}
//               <div className="flex items-center justify-center mb-6 space-x-6">
//                 <div className="flex items-center gap-2">
//                   <div className="w-4 h-4 bg-gray-200 border border-gray-400"></div>
//                   <span className="text-sm">Blank Table</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <div className="w-4 h-4 bg-blue-200 border border-blue-400"></div>
//                   <span className="text-sm">Running Table</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <div className="w-4 h-4 bg-green-200 border border-green-400"></div>
//                   <span className="text-sm">Printed Table</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <div className="w-4 h-4 bg-yellow-200 border border-yellow-400"></div>
//                   <span className="text-sm">Paid Table</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <div className="w-4 h-4 bg-orange-200 border border-orange-400"></div>
//                   <span className="text-sm">Running KOT Table</span>
//                 </div>
//               </div>

//               {/* Table Sections */}
//               <div className="space-y-8">
//                 {tableSections.map((section) => (
//                   <div key={section.name} className="bg-white rounded-lg p-4 shadow-sm">
//                     <h3 className="text-lg font-semibold mb-4 text-center">{section.name}</h3>
//                     <div className="grid grid-cols-4 gap-6 max-w-5xl mx-auto">
//                       {section.tables.map((table) => (
//                         <div
//                           key={table.id}
//                           className={`relative aspect-square rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg hover:scale-105 flex items-center justify-center ${getStatusColor(
//                             table.status
//                           )}`}
//                         >
//                           <div className="text-center">
//                             <div className="font-bold text-base">{table.name}</div>
//                           </div>
                          
//                           {/* Action Icons */}
//                           {table.status === 'running' && (
//                             <div className="absolute top-1 right-1">
//                               <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
//                                 <span className="text-white text-xs">•</span>
//                               </div>
//                             </div>
//                           )}
                          
//                           {table.status === 'printed' && (
//                             <div className="absolute top-1 right-1">
//                               <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
//                                 <span className="text-white text-xs">✓</span>
//                               </div>
//                             </div>
//                           )}
                          
//                           {table.status === 'paid' && (
//                             <div className="absolute top-1 right-1">
//                               <div className="w-4 h-4 bg-yellow-600 rounded-full flex items-center justify-center">
//                                 <span className="text-white text-xs">₹</span>
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </main>
//         </div>
//       </div>
//     </AuthGuard>
//   )
// }

// END OF COMMENTED CODE

