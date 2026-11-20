// Petit extrait au format réel des fichiers XML de l'ANSES (BOM, espaces autour des valeurs, virgule décimale)
const head = '﻿<?xml version="1.0" encoding="utf-8" ?>\n<TABLE>\n';

export const alimXml = `${head}   <ALIM>
      <alim_code> 20047 </alim_code>
      <alim_nom_fr> Poulet, blanc, cuit </alim_nom_fr>
      <alim_nom_sci missing=" " />
      <alim_grp_code> 04 </alim_grp_code>
      <alim_ssgrp_code> 0402 </alim_ssgrp_code>
   </ALIM>
   <ALIM>
      <alim_code> 19001 </alim_code>
      <alim_nom_fr> Crème fraîche, 30% MG, épaisse </alim_nom_fr>
      <alim_grp_code> 05 </alim_grp_code>
      <alim_ssgrp_code> 0501 </alim_ssgrp_code>
   </ALIM>
   <ALIM>
      <alim_code> 11000 </alim_code>
      <alim_nom_fr> Aliment sans calories UE </alim_nom_fr>
      <alim_grp_code> 09 </alim_grp_code>
      <alim_ssgrp_code> 0999 </alim_ssgrp_code>
   </ALIM>
</TABLE>`;

export const groupsXml = `${head}   <ALIM_GRP>
      <alim_grp_code> 04 </alim_grp_code>
      <alim_grp_nom_fr> viandes, œufs, poissons et assimilés </alim_grp_nom_fr>
      <alim_ssgrp_code> 0402 </alim_ssgrp_code>
      <alim_ssgrp_nom_fr> viandes cuites </alim_ssgrp_nom_fr>
   </ALIM_GRP>
   <ALIM_GRP>
      <alim_grp_code> 05 </alim_grp_code>
      <alim_grp_nom_fr> produits laitiers </alim_grp_nom_fr>
      <alim_ssgrp_code> 0501 </alim_ssgrp_code>
      <alim_ssgrp_nom_fr> - </alim_ssgrp_nom_fr>
   </ALIM_GRP>
</TABLE>`;

const line = (alim, code, teneur) => `   <COMPO>
      <alim_code> ${alim} </alim_code>
      <const_code> ${code} </const_code>
      <teneur> ${teneur} </teneur>
      <min missing=" " />
      <code_confiance> A </code_confiance>
   </COMPO>\n`;

export const compoXml =
  head +
  // Poulet : valeurs normales (le kcal 333 de Jones ne doit pas être préféré au 328)
  line(20047, 327, '632') +
  line(20047, 328, '151') +
  line(20047, 333, '149') +
  line(20047, 25003, '29,8') +
  line(20047, 31000, '0') +
  line(20047, 40000, '3,5') +
  line(20047, 400, '65') + // l'eau : ignorée
  // Crème : « traces » et « < x »
  line(19001, 328, '292') +
  line(19001, 25003, '&lt; 2,2') +
  line(19001, 31000, 'traces') +
  line(19001, 40000, '30') +
  // Aliment aux valeurs inconnues
  line(11000, 328, '-') +
  line(11000, 25003, '-') +
  line(11000, 31000, '&lt; 0,5') +
  line(11000, 40000, '0') +
  '</TABLE>';
