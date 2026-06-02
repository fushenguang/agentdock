/**
 * Greeting — domain type.
 * No Supabase types here; this is pure domain model.
 */
export interface Greeting {
  id: string;
  name: string;
  createdAt: string;
}
