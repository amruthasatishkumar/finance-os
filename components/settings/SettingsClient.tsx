'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, User, TrendingUp, Shield } from 'lucide-react'
import { SectionHeader } from '@/components/shared/index'
import { updateProfile, updateAssumptions } from '@/actions/profile'
import type { UserProfile, FinancialAssumptions } from '@/generated/prisma/client'

const profileSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().min(18).max(100),
  state: z.string().min(1),
  city: z.string().optional(),
  taxFilingStatus: z.string(),
  dependents: z.coerce.number().min(0).default(0),
  visaStatus: z.string(),
  homeCountry: z.string(),
  riskAppetite: z.enum(['conservative', 'moderate', 'aggressive']),
  planningStyle: z.enum(['aggressive_saver', 'balanced', 'lifestyle_optimizer']),
})

const assumptionsSchema = z.object({
  inflationRate: z.coerce.number().min(0).max(0.2),
  salaryGrowthRate: z.coerce.number().min(0).max(0.5),
  investmentReturnRate: z.coerce.number().min(0).max(0.5),
  stateTaxRate: z.coerce.number().min(0).max(0.2),
  filingStatus: z.string(),
  emergencyFundMonths: z.coerce.number().min(1).max(36),
  retirementAge: z.coerce.number().min(45).max(80),
  lifeExpectancy: z.coerce.number().min(60).max(120),
  includeSocialSecurity: z.boolean(),
  safeWithdrawalRate: z.coerce.number().min(0.02).max(0.08),
  usdToInrRate: z.coerce.number().min(50).max(200),
})

interface Props {
  profile: UserProfile | null
  assumptions: FinancialAssumptions | null
}

export function SettingsClient({ profile, assumptions }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'assumptions'>('profile')
  const [profileSaved, setProfileSaved] = useState(false)
  const [assumptionsSaved, setAssumptionsSaved] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      age: profile?.age ?? 29,
      state: profile?.state ?? 'California',
      city: profile?.city ?? '',
      taxFilingStatus: profile?.taxFilingStatus ?? 'single',
      dependents: profile?.dependents ?? 0,
      visaStatus: profile?.visaStatus ?? 'h1b',
      homeCountry: profile?.homeCountry ?? 'India',
      riskAppetite: (profile?.riskAppetite as any) ?? 'moderate',
      planningStyle: (profile?.planningStyle as any) ?? 'balanced',
    },
  })

  const assumptionsForm = useForm({
    resolver: zodResolver(assumptionsSchema),
    defaultValues: {
      inflationRate: assumptions?.inflationRate ?? 0.035,
      salaryGrowthRate: assumptions?.salaryGrowthRate ?? 0.05,
      investmentReturnRate: assumptions?.investmentReturnRate ?? 0.08,
      stateTaxRate: assumptions?.stateTaxRate ?? 0.093,
      filingStatus: assumptions?.filingStatus ?? 'single',
      emergencyFundMonths: assumptions?.emergencyFundMonths ?? 12,
      retirementAge: assumptions?.retirementAge ?? 60,
      lifeExpectancy: assumptions?.lifeExpectancy ?? 85,
      includeSocialSecurity: assumptions?.includeSocialSecurity ?? false,
      safeWithdrawalRate: assumptions?.safeWithdrawalRate ?? 0.04,
      usdToInrRate: assumptions?.usdToInrRate ?? 83.5,
      preTaxDeductions: (assumptions as any)?.preTaxDeductions ?? 23500,
    },
  })

  async function onSaveProfile(data: any) {
    await updateProfile(data)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  async function onSaveAssumptions(data: any) {
    await updateAssumptions(data)
    setAssumptionsSaved(true)
    setTimeout(() => setAssumptionsSaved(false), 3000)
  }

  const inputClass = 'w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm'
  const labelClass = 'text-xs text-[#94A3B8] mb-1.5 block font-medium'

  return (
    <div className="max-w-2xl p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#0B1120] p-1 rounded-xl w-fit">
        {[
          { key: 'profile', icon: <User className="w-4 h-4" />, label: 'Profile' },
          { key: 'assumptions', icon: <TrendingUp className="w-4 h-4" />, label: 'Assumptions' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-[#64748B] hover:text-white'}`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-6">
        <div className="mb-4"><SectionHeader title="Personal Profile" subtitle="Your identity and preferences" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Full Name</label>
              <input {...profileForm.register('name')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Age</label>
              <input {...profileForm.register('age')} type="number" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Home Country</label>
              <input {...profileForm.register('homeCountry')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>US State</label>
              <input {...profileForm.register('state')} className={inputClass} placeholder="California" />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input {...profileForm.register('city')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Visa Status</label>
              <select {...profileForm.register('visaStatus')} className={inputClass}>
                <option value="h1b">H1B</option>
                <option value="gc_pending">GC Pending</option>
                <option value="gc">Green Card</option>
                <option value="citizen">US Citizen</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Filing Status</label>
              <select {...profileForm.register('taxFilingStatus')} className={inputClass}>
                <option value="single">Single</option>
                <option value="married_jointly">Married Filing Jointly</option>
                <option value="married_separately">Married Filing Separately</option>
                <option value="head_of_household">Head of Household</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Dependents</label>
              <input {...profileForm.register('dependents')} type="number" min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Risk Appetite</label>
              <select {...profileForm.register('riskAppetite')} className={inputClass}>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Planning Style</label>
              <select {...profileForm.register('planningStyle')} className={inputClass}>
                <option value="aggressive_saver">Aggressive Saver</option>
                <option value="balanced">Balanced</option>
                <option value="lifestyle_optimizer">Lifestyle Optimizer</option>
              </select>
            </div>
          </div>
          <button type="submit" className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${profileSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
            <Save className="w-4 h-4" />
            {profileSaved ? 'Saved!' : 'Save Profile'}
          </button>
        </form>
      )}

      {activeTab === 'assumptions' && (
        <form onSubmit={assumptionsForm.handleSubmit(onSaveAssumptions)} className="space-y-6">
          <div className="mb-4"><SectionHeader title="Financial Assumptions" subtitle="Rates and parameters used in projections" /></div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'inflationRate', label: 'Inflation Rate (e.g. 0.035 = 3.5%)', step: '0.001' },
              { key: 'salaryGrowthRate', label: 'Expected Salary Growth', step: '0.01' },
              { key: 'investmentReturnRate', label: 'Investment Return Rate', step: '0.01' },
              { key: 'stateTaxRate', label: 'State Tax Rate (used for non-CA states)', step: '0.001' },
              { key: 'safeWithdrawalRate', label: 'Safe Withdrawal Rate', step: '0.001' },
              { key: 'usdToInrRate', label: 'USD to INR Rate', step: '0.5' },
              { key: 'emergencyFundMonths', label: 'Emergency Fund Months', step: '1' },
              { key: 'retirementAge', label: 'Target Retirement Age', step: '1' },
              { key: 'lifeExpectancy', label: 'Life Expectancy', step: '1' },
            ].map(({ key, label, step }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input {...assumptionsForm.register(key as any)} type="number" step={step} className={inputClass} />
              </div>
            ))}
            <div className="col-span-2">
              <label className={labelClass}>Annual Pre-tax Deductions ($)</label>
              <input {...assumptionsForm.register('preTaxDeductions' as any)} type="number" step="500" className={inputClass} />
              <p className="text-xs text-[#64748B] mt-1">
                Total of 401k traditional + HSA + FSA contributions per year. Reduces your federal and state taxable income. Max 401k 2025: $23,500. Max HSA: $4,300.
              </p>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Filing Status</label>
              <select {...assumptionsForm.register('filingStatus')} className={inputClass}>
                <option value="single">Single</option>
                <option value="married_jointly">Married Filing Jointly</option>
                <option value="married_separately">Married Filing Separately</option>
              </select>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-300 font-medium">Social Security for H1B</p>
                <p className="text-xs text-amber-200/70 mt-1 mb-3">The India-US Totalization Agreement does NOT cover Social Security. If you plan to return to India permanently, you likely won't receive SS benefits unless you work in the US for 10+ years.</p>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input {...assumptionsForm.register('includeSocialSecurity')} type="checkbox" className="w-4 h-4 accent-indigo-500" />
                  Include Social Security in retirement projections
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${assumptionsSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
            <Save className="w-4 h-4" />
            {assumptionsSaved ? 'Saved!' : 'Save Assumptions'}
          </button>
        </form>
      )}
    </div>
  )
}
