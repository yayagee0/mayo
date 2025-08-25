/**
 * Supabase Mock Client for Testing and Development
 * Provides complete mocking of Supabase client to prevent egress usage
 */

import type { Database } from './supabase'

// Mock data for testing
const MOCK_PROFILES = [
  {
    user_id: 'mock-uuid-1',
    email: 'nilezat@gmail.com',
    display_name: 'Ghassan',
    avatar_url: null,
    role: 'parent',
    dob: '1985-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    user_id: 'mock-uuid-2', 
    email: 'abdessamia.mariem@gmail.com',
    display_name: 'Mariem',
    avatar_url: null,
    role: 'parent',
    dob: '1988-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    user_id: 'mock-uuid-3',
    email: 'yazidgeemail@gmail.com', 
    display_name: 'Yazid',
    avatar_url: null,
    role: 'child',
    dob: '2015-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    user_id: 'mock-uuid-4',
    email: 'yahyageemail@gmail.com',
    display_name: 'Yahya', 
    avatar_url: null,
    role: 'child',
    dob: '2018-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const MOCK_ITEMS = [
  {
    id: 'mock-item-1',
    kind: 'text',
    author_id: 'mock-uuid-1',
    author_email: 'nilezat@gmail.com',
    visibility: 'all',
    body: 'Hello Family! This is a test post.',
    media_urls: null,
    parent_id: null,
    start_at: null,
    end_at: null,
    data: {},
    is_deleted: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
]

const MOCK_REFLECTIONS = [
  {
    id: 'mock-reflection-1',
    user_id: 'mock-uuid-1',
    mood_emoji: '😊',
    reflection_text: 'Grateful for family time today',
    week_start: '2024-01-01',
    created_at: '2024-01-01T20:00:00Z'
  }
]

const MOCK_ISLAMIC_QUESTIONS = [
  {
    id: 'mock-islamic-1',
    question_text: 'What should we say before eating?',
    options: ['Bismillah', 'Alhamdulillah', 'Allahu Akbar'],
    correct_index: 0,
    explanation_correct: 'Excellent! We say Bismillah to remember Allah before eating.',
    explanation_incorrect: 'That\'s okay! The correct answer is Bismillah. We say it to remember Allah before eating.',
    order_index: 1,
    category: 'Daily Life',
    created_at: '2024-01-01T00:00:00Z'
  }
]

// Mock query builder
class MockQueryBuilder {
  private tableName: string
  private queryType: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private data: any[] = []
  private whereConditions: Array<{ column: string, value: any, operator: string }> = []
  private limitValue?: number
  private selectColumns = '*'
  private insertData?: any
  private updateData?: any

  constructor(tableName: string) {
    this.tableName = tableName
    
    // Set mock data based on table
    switch (tableName) {
      case 'profiles':
        this.data = MOCK_PROFILES
        break
      case 'items':
        this.data = MOCK_ITEMS
        break
      case 'reflections':
        this.data = MOCK_REFLECTIONS
        break
      case 'islamic_questions':
        this.data = MOCK_ISLAMIC_QUESTIONS
        break
      default:
        this.data = []
    }
  }

  select(columns = '*') {
    this.queryType = 'select'
    this.selectColumns = columns
    return this
  }

  insert(data: any) {
    this.queryType = 'insert'
    this.insertData = Array.isArray(data) ? data : [data]
    return this
  }

  update(data: any) {
    this.queryType = 'update'
    this.updateData = data
    return this
  }

  delete() {
    this.queryType = 'delete'
    return this
  }

  eq(column: string, value: any) {
    this.whereConditions.push({ column, value, operator: 'eq' })
    return this
  }

  neq(column: string, value: any) {
    this.whereConditions.push({ column, value, operator: 'neq' })
    return this
  }

  gt(column: string, value: any) {
    this.whereConditions.push({ column, value, operator: 'gt' })
    return this
  }

  gte(column: string, value: any) {
    this.whereConditions.push({ column, value, operator: 'gte' })
    return this
  }

  lt(column: string, value: any) {
    this.whereConditions.push({ column, value, operator: 'lt' })
    return this
  }

  lte(column: string, value: any) {
    this.whereConditions.push({ column, value, operator: 'lte' })
    return this
  }

  ilike(column: string, value: any) {
    this.whereConditions.push({ column, value, operator: 'ilike' })
    return this
  }

  in(column: string, values: any[]) {
    this.whereConditions.push({ column, value: values, operator: 'in' })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    // Mock order - in real implementation would sort data
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  range(from: number, to: number) {
    // Mock range - in real implementation would slice data
    return this
  }

  private applyFilters(data: any[]) {
    let filteredData = data

    for (const condition of this.whereConditions) {
      filteredData = filteredData.filter(item => {
        const itemValue = item[condition.column]
        
        switch (condition.operator) {
          case 'eq':
            return itemValue === condition.value
          case 'neq':
            return itemValue !== condition.value
          case 'gt':
            return itemValue > condition.value
          case 'gte':
            return itemValue >= condition.value
          case 'lt':
            return itemValue < condition.value
          case 'lte':
            return itemValue <= condition.value
          case 'ilike':
            return itemValue?.toLowerCase().includes(condition.value.toLowerCase())
          case 'in':
            return condition.value.includes(itemValue)
          default:
            return true
        }
      })
    }

    return filteredData
  }

  private generateMockId() {
    return `mock-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateMockTimestamp() {
    return new Date().toISOString()
  }

  async single() {
    const result = await this.execute()
    if (result.error) return result
    
    if (!result.data || result.data.length === 0) {
      return { data: null, error: null }
    }
    
    if (result.data.length > 1) {
      return { 
        data: null, 
        error: { message: 'Multiple rows returned from single()', code: '400' } 
      }
    }
    
    return { data: result.data[0], error: null }
  }

  async maybeSingle() {
    const result = await this.execute()
    if (result.error) return result
    
    if (!result.data || result.data.length === 0) {
      return { data: null, error: null }
    }
    
    return { data: result.data[0], error: null }
  }

  private async execute() {
    try {
      switch (this.queryType) {
        case 'select': {
          let filteredData = this.applyFilters(this.data)
          
          if (this.limitValue) {
            filteredData = filteredData.slice(0, this.limitValue)
          }
          
          return { data: filteredData, error: null }
        }
        
        case 'insert': {
          const newItems = this.insertData.map((item: any) => ({
            id: this.generateMockId(),
            created_at: this.generateMockTimestamp(),
            updated_at: this.generateMockTimestamp(),
            ...item
          }))
          
          // Add to mock data for future queries
          this.data.push(...newItems)
          
          return { data: newItems, error: null }
        }
        
        case 'update': {
          const filteredData = this.applyFilters(this.data)
          
          const updatedItems = filteredData.map(item => ({
            ...item,
            ...this.updateData,
            updated_at: this.generateMockTimestamp()
          }))
          
          // Update mock data
          for (const updated of updatedItems) {
            const index = this.data.findIndex(item => item.id === updated.id)
            if (index !== -1) {
              this.data[index] = updated
            }
          }
          
          return { data: updatedItems, error: null }
        }
        
        case 'delete': {
          const filteredData = this.applyFilters(this.data)
          
          // Remove from mock data
          for (const item of filteredData) {
            const index = this.data.findIndex(d => d.id === item.id)
            if (index !== -1) {
              this.data.splice(index, 1)
            }
          }
          
          return { data: filteredData, error: null }
        }
        
        default:
          return { data: [], error: null }
      }
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' } 
      }
    }
  }

  // Promise-like interface
  then(onResolve: (result: any) => any, onReject?: (error: any) => any) {
    return this.execute().then(onResolve, onReject)
  }

  catch(onReject: (error: any) => any) {
    return this.execute().catch(onReject)
  }
}

// Mock auth
const mockAuth = {
  signInWithOAuth: async (options: any) => {
    console.warn('[Mock] signInWithOAuth called with:', options)
    return { 
      data: { 
        provider: options.provider,
        url: 'https://mock-oauth-url.com'
      }, 
      error: null 
    }
  },
  
  getUser: async () => {
    console.warn('[Mock] getUser called')
    return { 
      data: { 
        user: {
          id: 'mock-uuid-1',
          email: 'nilezat@gmail.com',
          user_metadata: {
            full_name: 'Ghassan Mock',
            avatar_url: null
          }
        } 
      }, 
      error: null 
    }
  },
  
  getSession: async () => {
    console.warn('[Mock] getSession called')
    return { 
      data: { 
        session: {
          access_token: 'mock-token',
          user: {
            id: 'mock-uuid-1',
            email: 'nilezat@gmail.com'
          }
        }
      }, 
      error: null 
    }
  },
  
  signOut: async () => {
    console.warn('[Mock] signOut called')
    return { error: null }
  },
  
  onAuthStateChange: (callback: any) => {
    console.warn('[Mock] onAuthStateChange called')
    // Simulate auth state
    setTimeout(() => {
      callback('SIGNED_IN', {
        access_token: 'mock-token',
        user: { id: 'mock-uuid-1', email: 'nilezat@gmail.com' }
      })
    }, 100)
    
    return {
      data: { subscription: { unsubscribe: () => {} } }
    }
  }
}

// Mock storage
const mockStorage = {
  from: (bucket: string) => ({
    upload: async (path: string, file: any, options?: any) => {
      console.warn('[Mock] storage.upload called:', { bucket, path, fileSize: file?.size })
      return { 
        data: { 
          path: `mock/${path}`,
          id: 'mock-file-id',
          fullPath: `${bucket}/mock/${path}`
        }, 
        error: null 
      }
    },
    
    remove: async (paths: string[]) => {
      console.warn('[Mock] storage.remove called:', { bucket, paths })
      return { data: paths.map(path => ({ name: path })), error: null }
    },
    
    list: async (path?: string, options?: any) => {
      console.warn('[Mock] storage.list called:', { bucket, path, options })
      return { 
        data: [
          { name: 'mock-file-1.jpg', id: 'mock-file-1', updated_at: '2024-01-01T00:00:00Z' },
          { name: 'mock-file-2.jpg', id: 'mock-file-2', updated_at: '2024-01-01T01:00:00Z' }
        ], 
        error: null 
      }
    },
    
    createSignedUrl: async (path: string, expiresIn: number) => {
      console.warn('[Mock] storage.createSignedUrl called:', { bucket, path, expiresIn })
      return { 
        data: { 
          signedUrl: `https://mock-storage.com/${bucket}/${path}?token=mock-token`
        }, 
        error: null 
      }
    }
  })
}

// Mock channel for realtime (will be handled by realtime guard)
const mockChannel = {
  on: (event: string, callback: any) => {
    console.warn('[Mock] realtime channel.on called:', event)
    return mockChannel
  },
  subscribe: () => {
    console.warn('[Mock] realtime channel.subscribe called')
    return mockChannel
  },
  unsubscribe: () => {
    console.warn('[Mock] realtime channel.unsubscribe called')
    return mockChannel
  }
}

// Main mock client
export const mockSupabaseClient = {
  from: (table: keyof Database['public']['Tables']) => {
    return new MockQueryBuilder(table)
  },
  
  auth: mockAuth,
  storage: mockStorage,
  
  channel: (name: string) => {
    console.warn('[Mock] channel created:', name)
    return mockChannel
  },
  
  removeChannel: (channel: any) => {
    console.warn('[Mock] removeChannel called')
  }
}

export type MockSupabaseClient = typeof mockSupabaseClient