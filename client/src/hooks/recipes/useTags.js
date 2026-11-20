import { listTags } from '../../services/tags/tagsService.js';
import { useLoad } from '../common/useLoad.js';

// Les étiquettes (Végé, Rapide…) : { tags, loading, error }.
export function useTags() {
  const { data, loading, error } = useLoad('tags', listTags);
  return { tags: data ?? [], loading, error };
}
