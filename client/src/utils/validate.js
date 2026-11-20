// Vérifie des valeurs avec un schéma Zod.
// Renvoie { data } si tout va bien, sinon { errors: { champ: 'message' } } (un message par champ, le premier).
export function validate(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data };

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.');
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { errors };
}
