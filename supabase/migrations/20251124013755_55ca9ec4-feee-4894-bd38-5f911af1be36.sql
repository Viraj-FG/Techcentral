-- Add batch insert function for transactional household data
CREATE OR REPLACE FUNCTION insert_household_batch(
  p_user_id uuid,
  p_members jsonb,
  p_pets jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_member jsonb;
  v_pet jsonb;
  v_members_count int := 0;
  v_pets_count int := 0;
BEGIN
  -- All inserts happen in same transaction (atomically)
  
  -- Insert household members
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
  LOOP
    INSERT INTO household_members (
      user_id, member_type, name, age, age_group,
      allergies, dietary_restrictions, health_conditions,
      gender, weight, height, activity_level
    ) VALUES (
      p_user_id,
      COALESCE((v_member->>'type')::text, 'other'),
      (v_member->>'name')::text,
      (v_member->>'age')::int,
      (v_member->>'ageGroup')::text,
      COALESCE((v_member->'allergies')::jsonb, '[]'::jsonb),
      COALESCE((v_member->'dietaryRestrictions')::jsonb, '[]'::jsonb),
      COALESCE((v_member->'healthConditions')::jsonb, '[]'::jsonb),
      (v_member->>'gender')::text,
      (v_member->>'weight')::numeric,
      (v_member->>'height')::numeric,
      (v_member->>'activityLevel')::text
    );
    v_members_count := v_members_count + 1;
  END LOOP;

  -- Insert pets
  FOR v_pet IN SELECT * FROM jsonb_array_elements(p_pets)
  LOOP
    INSERT INTO pets (
      user_id, name, species, breed, age, toxic_flags_enabled
    ) VALUES (
      p_user_id,
      (v_pet->>'name')::text,
      (v_pet->>'type')::text,
      (v_pet->>'breed')::text,
      (v_pet->>'age')::int,
      COALESCE((v_pet->>'toxicFlagsEnabled')::boolean, true)
    );
    v_pets_count := v_pets_count + 1;
  END LOOP;

  v_result := jsonb_build_object(
    'success', true,
    'members_count', v_members_count,
    'pets_count', v_pets_count
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- If any insert fails, entire transaction rolls back
  RAISE EXCEPTION 'Batch insert failed: %', SQLERRM;
END;
$$;