const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hzdjctvkrsmtjqhndckk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZGpjdHZrcnNtdGpxaG5kY2trIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgwNTE3NywiZXhwIjoyMDgzMzgxMTc3fQ.YZXOLal_UhuBainuuwaYKgtEGYd0KXTXDFzFIGis2CY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const userId = profiles[0].id;
  const { data: generations } = await supabase.from('generations').select('id').eq('type', 'quiz').limit(1);
  const genId = generations[0].id;

  const code = 'TESTCC';
  const { data: duel, error: duelError } = await supabase
      .from("duels")
      .insert({
          code,
          host_id: userId,
          generation_id: genId,
          status: 'WAITING',
          time_limit_seconds: 600,
          wager_xp: 50
      })
      .select(`
          *,
          host:profiles!host_id(id, username, first_name, avatar_url)
      `)
      .single();

  if (duelError) {
      console.error("Duel insertion error:", duelError);
      return;
  }

  console.log('Successfully created duel:', duel.id);

  const { data: gen, error: genError } = await supabase
      .from("generations")
      .select("id, title, content, type")
      .eq("id", genId)
      .single();

  if (genError) {
      console.error("Gen fetch error:", genError);
      return;
  }

  console.log("Successfully fetched generation:", gen.title);
  await supabase.from("duels").delete().eq("id", duel.id);
}

test();
