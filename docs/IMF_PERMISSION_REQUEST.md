# Draft: request for written permission to use IMF DataMapper / WEO data

> **Status: DRAFT. Nothing has been sent.** The owner (David Arango) reviews, signs and sends it from his own address. The IMF terms read on 2026-11-04 (imf.org/en/About/copyright-and-terms) say that data may be used citing the IMF and without altering its nature, while systematic download and commercial use of the content require written permission (copyright@imf.org). Until a reply arrives, IMF-based pieces are treated as personal/research use (the catalogue licence field says: confirm commercial reuse).

**To:** copyright@imf.org
**Subject:** Permission request: use of IMF DataMapper (World Economic Outlook) data in a free open-source charting tool and in commercial video content

Dear IMF Copyright team,

I am the author of *Ride the Lightning*, a free, open-source tool (public repository, MIT licence) that turns public statistical series into animated charts. I also publish commercial video content (financial education, YouTube and client work) made with it. I would like your written permission for the uses below, and I would be glad to adjust them to whatever conditions you set.

**What we use.** Only the public IMF DataMapper API (`https://www.imf.org/external/datamapper/api/v1/`), World Economic Outlook database, annual values:

1. **NGDP_RPCH**, Real GDP growth (annual % change): United States, China.
2. **GGXWDG_NGDP**, General government gross debt (% of GDP): 71 economies (JPN, USA, CAN, MEX, CHN, IND, KOR, IDN, SGP, VNM, THA, PHL, DEU, GBR, FRA, ITA, ESP, RUS, POL, NLD, CHE, IRL, SWE, TUR, AUS, SAU, ISR, ARE, EGY, ZAF, NGA, COL, BRA, ARG, CHL, PER, ECU, URY, PAN, CRI, BOL, PRY, DOM, GTM, HND, SLV, NIC, JAM, PRT, BEL, AUT, DNK, NOR, FIN, GRC, CZE, HUN, ROU, UKR, PAK, BGD, MYS, IRN, IRQ, QAT, MAR, KEN, ETH, GHA, NZL).
3. **GGXCNL_NGDP**, General government net lending/borrowing (% of GDP): the same economies plus VEN.

The tool excludes WEO projection years by default (it keeps the latest estimates and labels them as possibly estimates) and shows the IMF as the source, with the indicator name, country and last-modified date, in every chart.

**What we would do with it.**
- *Open-source tool:* the code downloads the data on the user's own machine, at the user's request, one indicator and country at a time. We do **not** redistribute IMF data files in the repository. Please tell us whether this on-demand access by each user is acceptable, or whether any other arrangement is needed.
- *Commercial videos:* animated charts of the figures above, always attributed to the IMF with the vintage of the data, never altered in nature (no re-scaling of values, no merging with other sources into new "IMF" figures).

**What we ask.**
1. Written permission (or the applicable licence) for the commercial video use described above.
2. Confirmation of whether on-demand retrieval of these indicators through the DataMapper API by end users of an open-source tool is permitted.
3. The exact attribution wording you require.

Thank you for your time. I can provide the repository link and example videos on request.

Kind regards,

David Arango
MacroWise
david@macrowise.co
