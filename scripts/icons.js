/**
 * Inline SVG Icon Helper using Lucide Icons
 * Generates lightweight, clean inline SVG icons without heavy runtime bloat.
 */

const lucide = require('lucide');

class IconHelper {
  /**
   * Get clean inline SVG string for an icon
   * @param {string} name - e.g. 'Scale', 'Shield', 'FileText', 'CheckCircle', 'Phone'
   * @param {Object} attrs - { size: 24, color: 'currentColor', strokeWidth: 2, class: 'icon-gold' }
   */
  static getSvg(name, attrs = {}) {
    const defaultAttrs = {
      xmlns: 'http://www.w3.org/2000/svg',
      width: attrs.size || 24,
      height: attrs.size || 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: attrs.color || 'currentColor',
      'stroke-width': attrs.strokeWidth || 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: attrs.class || `lucide lucide-${name.toLowerCase()}`
    };

    const icon = lucide.icons[name] || lucide.icons[name.charAt(0).toUpperCase() + name.slice(1)];
    if (!icon) {
      console.warn(`[IconHelper] Icon "${name}" not found in Lucide. Falling back to default.`);
      return `<svg width="${defaultAttrs.width}" height="${defaultAttrs.height}" viewBox="0 0 24 24" fill="none" stroke="${defaultAttrs.stroke}"><circle cx="12" cy="12" r="10"/></svg>`;
    }

    const contents = icon.map(([tag, elemAttrs]) => {
      const attrStr = Object.entries(elemAttrs).map(([k, v]) => `${k}="${v}"`).join(' ');
      return `<${tag} ${attrStr}></${tag}>`;
    }).join('');

    const outerAttrs = Object.entries(defaultAttrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<svg ${outerAttrs}>${contents}</svg>`;
  }
}

module.exports = IconHelper;

if (require.main === module) {
  console.log('--- Lucide Scale Icon Test ---');
  console.log(IconHelper.getSvg('Scale', { size: 24, color: '#c5a059' }));
}
