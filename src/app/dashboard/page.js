'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PlusIcon, EditIcon, TrashIcon, CheckIcon } from 'lucide-react'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [todos, setTodos] = useState([])
  const [newTask, setNewTask] = useState('')
  const [editingTodo, setEditingTodo] = useState(null)
  const [editTask, setEditTask] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loadingTodos, setLoadingTodos] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTodos()
    }
  }, [user])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('inserted_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar tarefas:', error)
      } else {
        setTodos(data || [])
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
    } finally {
      setLoadingTodos(false)
    }
  }

  const addTodo = async () => {
    if (!newTask.trim()) return

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            task: newTask.trim(),
            user_id: user.id,
            is_complete: false
          }
        ])
        .select()

      if (error) {
        console.error('Erro ao adicionar tarefa:', error)
      } else {
        setTodos([data[0], ...todos])
        setNewTask('')
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
    }
  }

  const updateTodo = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Erro ao atualizar tarefa:', error)
      } else {
        setTodos(todos.map(todo => 
          todo.id === id ? data[0] : todo
        ))
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
    }
  }

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar tarefa:', error)
      } else {
        setTodos(todos.filter(todo => todo.id !== id))
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
    }
  }

  const toggleComplete = async (todo) => {
    await updateTodo(todo.id, { is_complete: !todo.is_complete })
  }

  const startEdit = (todo) => {
    setEditingTodo(todo)
    setEditTask(todo.task)
    setIsDialogOpen(true)
  }

  const saveEdit = async () => {
    if (!editTask.trim()) return

    await updateTodo(editingTodo.id, { task: editTask.trim() })
    setEditingTodo(null)
    setEditTask('')
    setIsDialogOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading || loadingTodos) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                TO-DO App
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Olá, {user.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="destructive"
                size="sm"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Suas Tarefas
          </h2>
          
          {/* Formulário para adicionar nova tarefa */}
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Tarefa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua tarefa..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  className="flex-1"
                />
                <Button onClick={addTodo} disabled={!newTask.trim()}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de tarefas */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  Nenhuma tarefa encontrada. Adicione sua primeira tarefa acima!
                </p>
              </CardContent>
            </Card>
          ) : (
            todos.map((todo) => (
              <Card key={todo.id} className={todo.is_complete ? 'opacity-75' : ''}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleComplete(todo)}
                      className={todo.is_complete ? 'bg-green-100 border-green-300' : ''}
                    >
                      <CheckIcon className={`w-4 h-4 ${todo.is_complete ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    <span className={`flex-1 ${todo.is_complete ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.task}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startEdit(todo)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog para editar tarefa */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={editTask}
                onChange={(e) => setEditTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                placeholder="Digite a tarefa..."
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={saveEdit} disabled={!editTask.trim()}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

