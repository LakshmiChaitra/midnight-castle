import {TRAVELERS} from './travelers.js';
import {buildHero} from './hero-models.js';
import {buildPet} from './pet-travelers.js';
export {TRAVELERS};
export function buildTraveler(id){const spec=TRAVELERS.find(t=>t.id===id)||TRAVELERS[0];return ['girl','boy'].includes(spec.type)?buildHero(spec.id):buildPet(spec.id);}
