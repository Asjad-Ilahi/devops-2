"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Check, HelpCircle, Loader2, Mail, MessageSquare, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SupportPage() {
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "",
  })

  // Loading and alert states
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Handle contact form changes
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm({ ...contactForm, [name]: value })
  }

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(null)
    setError(null)

    // Validate form
    if (
      !contactForm.name ||
      !contactForm.email ||
      !contactForm.subject ||
      !contactForm.message ||
      !contactForm.category
    ) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess("Your message has been sent. We'll get back to you soon.")
      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "",
      })
    } catch (error) {
      setError("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 mb-2">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Help & Support</h1>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <Alert className="mb-6">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="contact">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gradient-to-r from-indigo-100 to-purple-100">
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Contact Us Tab */}
          <TabsContent value="contact">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Get in Touch
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={contactForm.name}
                          onChange={handleContactChange}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={contactForm.email}
                          onChange={handleContactChange}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={contactForm.category}
                        onValueChange={(value) => setContactForm({ ...contactForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account">Account Issues</SelectItem>
                          <SelectItem value="transfers">Transfers & Payments</SelectItem>
                          <SelectItem value="crypto">Crypto Wallet</SelectItem>
                          <SelectItem value="security">Security Concerns</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={contactForm.subject}
                        onChange={handleContactChange}
                        placeholder="Enter subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={contactForm.message}
                        onChange={handleContactChange}
                        placeholder="How can we help you?"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 mr-3 text-indigo-600" />
                      <div>
                        <div className="font-medium">Phone Support</div>
                        <div className="text-sm text-muted-foreground">(555) 123-4567</div>
                        <div className="text-sm text-muted-foreground">Mon-Fri: 8am-8pm ET</div>
                        <div className="text-sm text-muted-foreground">Sat-Sun: 9am-5pm ET</div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mr-3 text-indigo-600" />
                      <div>
                        <div className="font-medium">Email Support</div>
                        <div className="text-sm text-muted-foreground">support@zellebank.example.com</div>
                        <div className="text-sm text-muted-foreground">Response within 24 hours</div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 mr-3 text-indigo-600" />
                      <div>
                        <div className="font-medium">Live Chat</div>
                        <div className="text-sm text-muted-foreground">Available in the mobile app</div>
                        <div className="text-sm text-muted-foreground">Mon-Fri: 8am-8pm ET</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-red-50 rounded-md border border-red-200 shadow-md">
                      <div className="font-medium text-red-600 mb-2">Lost or Stolen Card?</div>
                      <div className="text-sm text-red-600 mb-4">Call our 24/7 emergency line immediately:</div>
                      <div className="text-lg font-bold text-red-600">1-800-555-9876</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>Find answers to common questions about our banking services</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How do I send money with Zelle?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">To send money with Zelle, follow these steps:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li>Log in to your account and navigate to the Transfers section</li>
                        <li>Select "Zelle Transfer" from the options</li>
                        <li>Choose a recipient from your contacts or add a new one</li>
                        <li>Enter the amount you want to send</li>
                        <li>Review and confirm the transfer details</li>
                      </ol>
                      <p className="mt-2">
                        The recipient will receive the money typically within minutes if they're already enrolled with
                        Zelle.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>How do I set up two-factor authentication?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Setting up two-factor authentication adds an extra layer of security to your account. To enable
                        it:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li>Go to your Profile Settings</li>
                        <li>Select the "Security" or "Two-Factor" tab</li>
                        <li>Toggle the switch to enable two-factor authentication</li>
                        <li>Choose your preferred verification method (email, SMS, or authenticator app)</li>
                        <li>Follow the on-screen instructions to complete the setup</li>
                      </ol>
                      <p className="mt-2">
                        Once enabled, you'll need to provide a verification code in addition to your password when
                        logging in.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>How does the Bitcoin wallet work?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Our Bitcoin wallet allows you to buy, sell, and hold Bitcoin directly within your banking app.
                        Here's how it works:
                      </p>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        <li>Navigate to the Crypto section in your dashboard</li>
                        <li>You can buy Bitcoin using funds from your checking account</li>
                        <li>You can sell Bitcoin and receive the funds in your checking account</li>
                        <li>Real-time price updates show you the current value of your holdings</li>
                        <li>All transactions are secured and recorded in your transaction history</li>
                      </ul>
                      <p className="mt-2">
                        Please note that cryptocurrency investments are subject to market risks and price volatility.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>What should I do if I forget my password?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">If you forget your password, you can reset it by following these steps:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li>Click on the "Forgot Password" link on the login page</li>
                        <li>Enter your username or email address</li>
                        <li>Choose how you want to receive the verification code (email or SMS)</li>
                        <li>Enter the verification code you receive</li>
                        <li>Create a new password following the security requirements</li>
                      </ol>
                      <p className="mt-2">
                        If you're still having trouble, please contact our customer support for assistance.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger>Are there any fees for using Zelle?</AccordionTrigger>
                    <AccordionContent>
                      <p>
                        There are no fees to send or receive money with Zelle. However, please note that your mobile
                        carrier's message and data rates may apply when using the service through our mobile app.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6">
                    <AccordionTrigger>How long does it take for transfers to process?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">Transfer processing times vary depending on the type of transfer:</p>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        <li>
                          <strong>Zelle transfers:</strong> Typically within minutes if the recipient is already
                          enrolled with Zelle
                        </li>
                        <li>
                          <strong>Internal transfers:</strong> Between your own accounts are instant
                        </li>
                        <li>
                          <strong>External transfers:</strong> To other banks usually take 1-3 business days
                        </li>
                        <li>
                          <strong>Wire transfers:</strong> Same-day processing if submitted before the cutoff time
                        </li>
                      </ul>
                      <p className="mt-2">
                        Weekends and holidays may affect processing times for certain types of transfers.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter>
                <div className="w-full p-4 bg-muted rounded-md">
                  <div className="flex items-start">
                    <HelpCircle className="h-5 w-5 mr-3 text-indigo-600" />
                    <div>
                      <div className="font-medium">Can't find what you're looking for?</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Contact our support team for personalized assistance.
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="#contact">Contact Support</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Guides & Tutorials
                  </CardTitle>
                  <CardDescription>Step-by-step instructions for using our banking features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                    <div className="font-medium">Getting Started Guide</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Learn the basics of navigating your account and using key features
                    </div>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link href="#">View Guide</Link>
                    </Button>
                  </div>

                  <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                    <div className="font-medium">Zelle Transfer Tutorial</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Learn how to send and receive money with Zelle
                    </div>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link href="#">View Tutorial</Link>
                    </Button>
                  </div>

                  <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                    <div className="font-medium">Crypto Wallet Guide</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Everything you need to know about buying and selling Bitcoin
                    </div>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link href="#">View Guide</Link>
                    </Button>
                  </div>

                  <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                    <div className="font-medium">Security Best Practices</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Tips for keeping your account secure and preventing fraud
                    </div>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link href="#">View Guide</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Video Tutorials
                  </CardTitle>
                  <CardDescription>Watch step-by-step video guides for our banking features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="font-medium mb-2">How to Send Money with Zelle</div>
                      <Button variant="outline" size="sm">
                        Watch Video
                      </Button>
                    </div>
                  </div>

                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="font-medium mb-2">Setting Up Two-Factor Authentication</div>
                      <Button variant="outline" size="sm">
                        Watch Video
                      </Button>
                    </div>
                  </div>

                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="font-medium mb-2">Using the Bitcoin Wallet</div>
                      <Button variant="outline" size="sm">
                        Watch Video
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Downloads & Forms
                  </CardTitle>
                  <CardDescription>Access important documents and forms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                      <div className="font-medium">Account Terms & Conditions</div>
                      <div className="text-sm text-muted-foreground mb-2">PDF, 1.2 MB</div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>

                    <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                      <div className="font-medium">Privacy Policy</div>
                      <div className="text-sm text-muted-foreground mb-2">PDF, 850 KB</div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>

                    <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                      <div className="font-medium">Direct Deposit Form</div>
                      <div className="text-sm text-muted-foreground mb-2">PDF, 500 KB</div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>

                    <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                      <div className="font-medium">Wire Transfer Form</div>
                      <div className="text-sm text-muted-foreground mb-2">PDF, 600 KB</div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>

                    <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                      <div className="font-medium">Account Closure Form</div>
                      <div className="text-sm text-muted-foreground mb-2">PDF, 450 KB</div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>

                    <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                      <div className="font-medium">Dispute Resolution Form</div>
                      <div className="text-sm text-muted-foreground mb-2">PDF, 550 KB</div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
