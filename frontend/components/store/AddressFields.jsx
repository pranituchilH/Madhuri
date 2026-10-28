import { INDIAN_STATES } from '@/lib/format';

export const EMPTY_ADDRESS = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export default function AddressFields({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="a-name">Full name</label>
        <input id="a-name" required className="input" value={value.name} onChange={set('name')} autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="a-phone">Mobile number</label>
        <input id="a-phone" required className="input" value={value.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" title="10-digit mobile number" autoComplete="tel-national" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="a-line1">Address</label>
        <input id="a-line1" required className="input" value={value.line1} onChange={set('line1')} placeholder="House no., building, street" autoComplete="address-line1" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="a-line2">Landmark / Area (optional)</label>
        <input id="a-line2" className="input" value={value.line2 || ''} onChange={set('line2')} autoComplete="address-line2" />
      </div>
      <div>
        <label className="label" htmlFor="a-city">City</label>
        <input id="a-city" required className="input" value={value.city} onChange={set('city')} autoComplete="address-level2" />
      </div>
      <div>
        <label className="label" htmlFor="a-pin">Pincode</label>
        <input id="a-pin" required className="input" value={value.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} pattern="[0-9]{6}" title="6-digit pincode" autoComplete="postal-code" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="a-state">State</label>
        <select id="a-state" required className="input" value={value.state} onChange={set('state')}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}
