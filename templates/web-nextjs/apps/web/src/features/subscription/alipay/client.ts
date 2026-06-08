'use client'

interface InitiateAlipayPaymentResult {
  formHtml?: string
  redirectUrl?: string
}

export async function initiateAlipayPayment(paymentId: number, userId: string): Promise<void> {
  const res = await fetch('/api/payments/alipay/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, userId }),
  })

  if (!res.ok) {
    throw new Error('Failed to initiate Alipay payment')
  }

  const data: InitiateAlipayPaymentResult = await res.json()

  if (data.formHtml) {
    // PC page pay: inject form HTML and auto-submit
    const div = document.createElement('div')
    div.innerHTML = data.formHtml
    document.body.appendChild(div)
    const form = div.querySelector('form')
    if (form) {
      form.submit()
    }
  } else if (data.redirectUrl) {
    // H5 wap pay: redirect
    window.location.href = data.redirectUrl
  } else {
    throw new Error('Unexpected Alipay response')
  }
}
