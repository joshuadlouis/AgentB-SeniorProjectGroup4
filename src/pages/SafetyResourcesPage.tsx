import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, ExternalLink, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections = [
  {
    title: "Emergency Contacts",
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold text-destructive">For emergencies, text or dial 911 or (202) 806-7777</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="font-medium">Suicide &amp; Crisis Lifeline:</span>
            <a href="tel:988" className="text-primary underline">988</a>
          </div>
          <div>
            <p className="font-medium">Department of Public Safety</p>
            <a href="tel:2028061100" className="text-primary underline text-sm">(202) 806-1100</a>
          </div>
          <div>
            <p className="font-medium">Howard University Hospital Security</p>
            <a href="tel:2028651103" className="text-primary underline text-sm">(202) 865-1103</a>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Policy Prohibiting Sex and Gender-Based Discrimination, Sexual Misconduct and Retaliation (Title IX)",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p><span className="font-medium text-foreground">Policy Number:</span> 400-005 Governance, Risk and Compliance</p>
        <p><span className="font-medium text-foreground">Policy Title:</span> Policy Prohibiting Sex and Gender-Based Discrimination, Sexual Misconduct and Retaliation</p>
        <p><span className="font-medium text-foreground">Responsible Officers:</span> Provost and Chief Academic Officer; Delegated Responsible Officer: Title IX Director</p>
        <p><span className="font-medium text-foreground">Responsible Offices:</span> Office of the Provost and Chief Academic Officer; Delegated Responsible Office: Title IX Office</p>
        <p><span className="font-medium text-foreground">Effective Date:</span> August 14, 2020 (Re-issued January 31, 2025; revised August 1, 2024)</p>
        <p><span className="font-medium text-foreground">Next Review Date:</span> February 2025</p>
        <p><span className="font-medium text-foreground">Summary:</span> Howard University is committed to ensuring compliance with federal laws that prohibit sex discrimination as well as applicable state and local laws that prohibit sex and gender-based discrimination, including sexual misconduct such as sexual harassment, sexual assault, dating violence, domestic violence, and stalking. Retaliation against anyone involved in filing an internal report or complaint under this policy is prohibited, will not be tolerated and will be subject to separate sanctions.</p>
      </div>
    ),
  },
  {
    title: "Title IX Incident Report Form",
    content: (
      <div className="space-y-3 text-sm">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-destructive font-medium text-xs">TO REPORT AN EMERGENCY OR INCIDENT THAT POSES AN IMMINENT RISK OF HARM, BEFORE COMPLETING THIS FORM, CALL HU DEPARTMENT OF PUBLIC SAFETY AT 202-806-7777, LOCAL POLICE AT 911 OR SUICIDE AND CRISIS LIFELINE AT 988.</p>
        </div>
        <a
          href="https://cm.maxient.com/reportingform.php?HowardUniv&layout_id=90"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary underline font-medium"
        >
          <ExternalLink className="h-4 w-4" />
          Open Incident Report Form
        </a>
      </div>
    ),
  },
  {
    title: "HU Dept. Of Public Safety (DPS) & DC Metropolitan Police Dept. (MPD)",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>Victims/survivors of sexual misconduct and sexual violence may contact the Howard University Department of Public Safety (DPS) and/or the Metropolitan Police Department (MPD) in order to report such incidents to law enforcement.</p>
        <div>
          <p className="font-medium text-foreground">Howard University Department of Public Safety (DPS)</p>
          <p>2244 10th Street, N.W., Suite 270, Washington, D.C. 20059</p>
          <p>Phone: <a href="tel:2028061100" className="text-primary underline">(202) 806-1100</a></p>
          <p>Emergency: <a href="tel:2028067777" className="text-primary underline">(202) 806-7777</a></p>
        </div>
        <div>
          <p className="font-medium text-foreground">DC Metropolitan Police Department (MPD)</p>
          <p>1620 V Street, N.W., Washington, D.C. 20009</p>
          <p>Third District: <a href="tel:2026736815" className="text-primary underline">(202) 673-6815</a></p>
          <p>Detectives Office: <a href="tel:2026736918" className="text-primary underline">(202) 673-6918</a></p>
          <p>Emergency: <a href="tel:911" className="text-primary underline">911</a></p>
        </div>
      </div>
    ),
  },
  {
    title: "Mental Health And Emotional Support - Online/Telehealth Resources",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>If you would like to access online or telehealth mental health services, the following resources are available to you:</p>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">University Counseling Service</p>
            <p>Daytime/Weekdays: <a href="tel:2028066870" className="text-primary underline">(202) 806-6870</a></p>
            <p>Crisis Line (After Hours & Weekends): <a href="tel:2023456709" className="text-primary underline">(202) 345-6709</a>, Monday-Friday, 6 p.m. to 8 a.m. and 24/7 on weekends.</p>
            <a href="https://studentaffairs.howard.edu/opportunities/clinical-psychology-training" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              Clinical Psychology Training <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div>
            <p className="font-medium text-foreground">"Healthiest You" - Student Telehealth Mental Health Provider</p>
            <p>Phone: <a href="tel:8558705858" className="text-primary underline">855-870-5858</a></p>
            <a href="https://telehealth4students.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              telehealth4students.com <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div>
            <p className="font-medium text-foreground">Employee Assistance Program (EAP)</p>
            <p>Howard offers the LifeWorks Employee Assistance Program through MetLife – at no cost to you. Call <a href="tel:8883197819" className="text-primary underline">888-319-7819</a>, log on to metlifeeap.lifeworks.com or download the LifeWorks app (username: metlifeeap, password: eap). Available 24/7/365. Includes up to 5 phone or video consultations with a licensed counselor per issue, per calendar year.</p>
            <div className="flex flex-col gap-1 mt-1">
              <a href="https://myhowardbenefits.com/public/welcome" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                MyHoward Benefits <ExternalLink className="h-3 w-3" />
              </a>
              <a href="https://howard.edu/sites/home.howard.edu/files/2022-11/EAP%20Manager%27s%20Guide-%20%20Standard%20Option.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                EAP Manager's Guide <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div>
          <p className="font-medium text-foreground mb-2">Additional Resources</p>
          <ul className="space-y-1 pl-4">
            <li><a href="https://www.betterhelp.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">BetterHelp - 24/7 counseling <ExternalLink className="h-3 w-3" /></a></li>
            <li><a href="https://www.nami.org/nami-news/nami-updates-on-the-coronavirus/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">NAMI - Updates on the Coronavirus <ExternalLink className="h-3 w-3" /></a></li>
            <li><a href="https://adaa.org" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Anxiety and Depression Association of America <ExternalLink className="h-3 w-3" /></a></li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Interpersonal Violence Prevention Program (IVPP)",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>The Howard University Interpersonal Violence Prevention Program (IVPP) provides confidential advocacy, safety planning, referrals and support.</p>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Phone:</span>
          <a href="tel:2028361401" className="text-primary underline">(202) 836-1401</a>
        </div>
      </div>
    ),
  },
  {
    title: "University Counseling Service",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Provides individual and group counseling, psychotherapy, crisis intervention and consultation for students.</p>
        <a href="https://studentaffairs.howard.edu/wellness/get-counseling-services" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
          Get Counseling Services <ExternalLink className="h-3 w-3" />
        </a>
        <div>
          <p className="font-medium text-foreground">Location</p>
          <p>CB Powell/School of Communications Building</p>
          <p>6th and Bryant Streets, N.W.</p>
          <p>Washington, D.C. 20059</p>
        </div>
        <div>
          <p>Phone: <a href="tel:2028066870" className="text-primary underline">(202) 806-6870</a></p>
          <p>Hours: 8:00 am - 6:00 pm</p>
          <p>Crisis Line: <a href="tel:2023456709" className="text-primary underline">(202) 345-6709</a> (after hours, weekends and holidays)</p>
        </div>
      </div>
    ),
  },
  {
    title: "Contact the Title IX Office",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Angie Logan-Pope — Title IX Director</p>
        <div>
          <p>Phone: <a href="tel:2028062550" className="text-primary underline">(202) 806-2550</a></p>
          <p>Email: <a href="mailto:TitleIX@howard.edu" className="text-primary underline">TitleIX@howard.edu</a></p>
          <p>Address: 2400 6th Street NW, Washington, DC 20059</p>
        </div>
      </div>
    ),
  },
  {
    title: "LGBTQ+ Resources",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <h4 className="font-semibold text-foreground mb-2">On Campus</h4>
          <p className="mb-1"><span className="font-medium text-foreground">The Intercultural Affairs & LGBTQ+ Resource Center</span> — <a href="tel:2028066651" className="text-primary underline">(202) 806-6651</a></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium">Support & Advocacy:</span> individualized support on personal, academic, and professional goals</li>
            <li><span className="font-medium">Education & Awareness:</span> safe spaces and opportunities for dialogue, education, and awareness building</li>
            <li><span className="font-medium">Community Building:</span> meaningful partnerships and collaborations to nurture a caring and inclusive community</li>
          </ul>
          <p className="mt-2">LGBTQ+ Support from the Division of Student Affairs — learn about pronoun usage, LGBTQ+ student organizations, and how to request gender-inclusive housing.</p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">Off Campus</h4>
          {[
            { label: "Health", links: [
              { url: "https://www.gmhc.org", desc: "AIDS/HIV" },
              { url: "https://out2enroll.org", desc: "Health insurance & ACA enrollment" },
              { url: "https://www.glma.org", desc: "Find healthcare providers" },
              { url: "https://cancer-network.org", desc: "Cancer survivors / those at risk" },
            ]},
            { label: "Mental Health", links: [
              { url: "https://www.helpguide.org/articles/depression/teenagers-guide-to-depression.htm", desc: "Depression" },
              { url: "https://adaa.org", desc: "Anxiety" },
              { url: "https://save.org", desc: "Suicide prevention" },
              { url: "https://suicidepreventionlifeline.org", desc: "Suicide prevention" },
            ]},
            { label: "Advocacy / Rights", links: [
              { url: "https://www.aclu.org/issues/lgbtq-rights", desc: "ACLU" },
              { url: "https://www.lambdalegal.org", desc: "Lambda Legal" },
              { url: "https://www.hrc.org", desc: "Human Rights Campaign" },
              { url: "https://www.nclrights.org", desc: "National Center for Lesbian Rights" },
            ]},
            { label: "Identity", links: [
              { url: "https://bi.org/en", desc: "Bisexual.org" },
              { url: "https://transequality.org", desc: "National Center for Transgender Equality" },
              { url: "https://transgenderlawcenter.org", desc: "Transgender Law Center" },
            ]},
            { label: "Youth", links: [
              { url: "https://www.glsen.org/about-us", desc: "GLSEN" },
              { url: "https://gsanetwork.org", desc: "GSA Network" },
            ]},
            { label: "Scholarships", links: [
              { url: "https://pointfoundation.org/point-apply/application-faqs/", desc: "Point Foundation" },
              { url: "https://fundforeducationabroad.org/scholarship/rainbow-scholarship/", desc: "Rainbow Scholarship" },
              { url: "https://www.stonewallfoundation.org/scholarships", desc: "Stonewall Foundation" },
            ]},
            { label: "General", links: [
              { url: "https://www.thetrevorproject.org/resources/category/mental-health/", desc: "Trevor Project" },
              { url: "https://avp.org", desc: "Violence prevention" },
              { url: "https://pflag.org/about", desc: "PFLAG — for allies, families, parents" },
            ]},
          ].map(category => (
            <div key={category.label} className="mb-3">
              <p className="font-medium text-foreground mb-1">{category.label}</p>
              <ul className="space-y-1 pl-4">
                {category.links.map(link => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                      {link.desc} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "HU Healthcare: Howard University Hospital & The Student Health Center",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Howard University Student Health Center</p>
        <p>
          <a href="http://huhealthcare.com/healthcare/students" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
            huhealthcare.com/healthcare/students <ExternalLink className="h-3 w-3" />
          </a>
        </p>
        <p>2139 Georgia Avenue, NW (corner of W Street and Georgia Avenue), Washington, D.C. 20059</p>
        <p>Phone: <a href="tel:2028067540" className="text-primary underline">(202) 806-7540</a></p>
        <p>Hours: Monday – Friday, 8:30 am – 5:00 pm (Closed for lunch 12:30–1:30 pm)</p>
        <p>
          To make an appointment online:{" "}
          <a href="https://patientportal.advancedmd.com/149221/onlinescheduling/existing" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
            Schedule Appointment <ExternalLink className="h-3 w-3" />
          </a>
        </p>

        <div className="border-t border-border pt-4">
          <p className="font-medium text-foreground">Howard University Hospital</p>
          <p>
            <a href="http://huhealthcare.com/healthcare/hospital" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              huhealthcare.com/healthcare/hospital <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <p>2041 Georgia Avenue, N.W., Washington, D.C. 20060</p>
          <p>Phone: <a href="tel:2028651131" className="text-primary underline">(202) 865-1131</a></p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-medium text-foreground">Forensic Examinations</p>
          <p>Forensic examinations for survivors of sexual assault or dating/domestic violence are provided by District of Columbia Forensic Nurse Examiners (DCFNE):{" "}
            <a href="https://www.dcfne.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              dcfne.org <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-medium text-foreground">MedStar Washington Hospital Center – 24 hours/7 days a week</p>
          <p>
            <a href="https://www.medstarwashington.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              medstarwashington.org <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <p>110 Irving St., NW, Washington, D.C. 20010</p>
          <p>Phone: <a href="tel:2028777000" className="text-primary underline">(202) 877-7000</a> or DC Victim Hotline: <a href="tel:8444435732" className="text-primary underline">(844) 443-5732</a></p>
          <p className="text-xs italic">*Though based at Medstar, Sexual Assault Nurse Examiners can also travel to other DC hospitals to perform an exam.{" "}
            <a href="https://static1.squarespace.com/static/5cb617977fdcb821197ec202/t/5d83d0671010f46908ca0302/1568919657067/SANE+exam+process_Eng+%26+Span.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-medium text-foreground">DCFNE's Forensic Nursing Clinic – by appointment</p>
          <p>101 Q St NE, 2nd floor, Washington, D.C. 20002</p>
          <p>Call <a href="tel:8444435732" className="text-primary underline">844-4HELP-DC (844-443-5732)</a> to schedule.{" "}
            <a href="https://www.dcfne.org/faq" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Local, National & International Resources",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Off Campus Resources (Washington, DC)</p>
        <ul className="space-y-3 pl-4 list-disc">
          <li>
            <span className="font-medium text-foreground">DC Rape Crisis Center</span> (<a href="tel:2023337273" className="text-primary underline">202-333-RAPE</a>) – 24-hour hotline, therapeutic services, individual and group counseling, and advocacy.{" "}
            <a href="https://www.dcrcc.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">dcrcc.org <ExternalLink className="h-3 w-3" /></a>
          </li>
          <li>
            <span className="font-medium text-foreground">DC Victim Hotline</span> (<a href="tel:8444435732" className="text-primary underline">844-4HELPDC</a>) – Free confidential, around-the-clock information and referrals for victims of all crime in DC.{" "}
            <a href="https://dcvictim.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">dcvictim.org <ExternalLink className="h-3 w-3" /></a>
          </li>
          <li>
            <span className="font-medium text-foreground">Network for Victim Recovery of DC (NVRDC)</span> (<a href="tel:2027421727" className="text-primary underline">202-742-1727</a>) – Advocacy, case management, and legal services.{" "}
            <a href="https://www.nvrdc.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">nvrdc.org <ExternalLink className="h-3 w-3" /></a>
          </li>
          <li>
            <span className="font-medium text-foreground">Crime Victims Compensation Program</span> (<a href="tel:2028794230" className="text-primary underline">202-879-4230</a>) – Financial assistance and reimbursement for crime-related expenses.{" "}
            <a href="https://howard.edu/sites/home.howard.edu/files/2024-02/CVCP%20Information%20Brochure.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Info brochure <ExternalLink className="h-3 w-3" /></a>
          </li>
        </ul>

        <div className="border-t border-border pt-4">
          <p className="font-medium text-foreground">Local and National Resources</p>
          <ul className="space-y-3 pl-4 list-disc">
            <li>
              <span className="font-medium text-foreground">Futures Without Violence</span> – Resources addressing violence during the coronavirus pandemic.{" "}
              <a href="https://www.workplacesrespond.org/page/covid19supportingworkers/#survivorsfamilyfriends" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">COVID-19 Resource Page <ExternalLink className="h-3 w-3" /></a>
            </li>
            <li>
              <span className="font-medium text-foreground">RAINN</span> – National Sexual Assault Hotline: <a href="tel:18006564673" className="text-primary underline">800-656-HOPE</a> or{" "}
              <a href="https://hotline.rainn.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">online chat</a>. Learn more at{" "}
              <a href="https://www.rainn.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">rainn.org <ExternalLink className="h-3 w-3" /></a>
            </li>
            <li>
              <span className="font-medium text-foreground">National Network to End Domestic Violence (NNEDV)</span> – Additional resources.{" "}
              <a href="https://nnedv.org/latest_update/resources-response-coronavirus-covid-19/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Learn more <ExternalLink className="h-3 w-3" /></a>
            </li>
          </ul>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-medium text-foreground">International Resources</p>
          <ul className="space-y-3 pl-4 list-disc">
            <li>
              <span className="font-medium text-foreground">NO MORE Global Directory</span> – Comprehensive international directory of domestic violence and sexual assault resources in every UN-recognized country.{" "}
              <a href="https://nomoredirectory.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">nomoredirectory.org <ExternalLink className="h-3 w-3" /></a>
            </li>
            <li>
              <span className="font-medium text-foreground">United Nations</span> – Helplines by country for people experiencing relationship abuse.{" "}
              <a href="https://www.unwomen.org/en/what-we-do/ending-violence-against-women/faqs/signs-of-abuse" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">UN Women <ExternalLink className="h-3 w-3" /></a>
            </li>
            <li>
              <span className="font-medium text-foreground">Pathways to Safety International</span> – Victim advocacy for sexual assault, relationship violence and stalking outside the U.S. Email: <a href="mailto:crisis@pathwaystosafety.org" className="text-primary underline">crisis@pathwaystosafety.org</a> (response within 72 hours).{" "}
              <a href="https://pathwaystosafety.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">pathwaystosafety.org <ExternalLink className="h-3 w-3" /></a>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
];

const SafetyResourcesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Safety & Resources</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Card className="p-6 border-border">
          <Accordion type="single" collapsible className="w-full">
            {sections.map((section, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{section.title}</AccordionTrigger>
                <AccordionContent>{section.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </main>
    </div>
  );
};

export default SafetyResourcesPage;
