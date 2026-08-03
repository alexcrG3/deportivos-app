import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const postToInsert = {
    id: `post_test_supabase_${Date.now()}`,
    autor: "Carlos Araya",
    usuario: "@carlosaraya",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    tiempo: "2 ago · 22:44",
    tipo: "publicacion",
    contenido: "Prueba directa via Supabase client JS",
    imagen: null,
    categoria: "Sub-9",
    likes: 1,
    liked: true,
    saved: false,
    comentarios: [],
    organizacion_id: "00000000-0000-0000-0000-000000000000"
  };

  const { data, error } = await supabase.from("muro_posts").insert(postToInsert).select();
  if (error) {
    console.error("❌ ERROR de Supabase:", error);
  } else {
    console.log("✅ ÉXITO de inserción en Supabase muro_posts:", data);
  }
}

testInsert();
