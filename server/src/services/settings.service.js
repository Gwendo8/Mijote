import * as settingsRepository from '../repositories/settings.repository.js';

export const get = () => settingsRepository.get();
export const update = (data) => settingsRepository.update(data);
