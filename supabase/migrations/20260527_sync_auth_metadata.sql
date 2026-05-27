-- Create a function to sync profile fields to auth.users raw_user_meta_data
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'username', NEW.username,
      'age', NEW.age
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync on INSERT or UPDATE of profiles
DROP TRIGGER IF EXISTS tr_sync_profile_to_auth_metadata ON public.profiles;
CREATE TRIGGER tr_sync_profile_to_auth_metadata
AFTER INSERT OR UPDATE OF first_name, last_name, username, age ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_auth_metadata();
