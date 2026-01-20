# Welcome to ProcessMind API Examples!

Thank you for visiting this repository! Here you'll find a curated collection of examples demonstrating how to interact with the ProcessMind API. Whether you're just getting started or looking to integrate [ProcessMind](https://processmind.com) into your workflow, these samples are designed to help you succeed.

We provide practical examples for interacting with the API in several popular languages and tools, including Bash (curl), JavaScript, and Python. Each example is self-contained and includes detailed instructions—just check the individual files for more information.

## Quick Start

To use these examples, you will need a ProcessMind API key. If you haven't already, you can easily sign up at [ProcessMind](https://app.processmind.com).

For more details on obtaining your API key, please refer to the official documentation:  
https://processmind.com/resources/docs/api/api-key

You'll also find guidance on how to retrieve your tenant and datatable IDs here:  
https://processmind.com/resources/docs/api/api-calls

## Available Examples

### Data Upload
| Script | JavaScript | Bash | Python |
|--------|------------|------|--------|
| Upload data file to a datatable | `uploadToProcessMind.js` | `uploadToProcessMind.sh` | `uploadToProcessMind.py` |

### Process Management
| Script | JavaScript | Bash | Python |
|--------|------------|------|--------|
| Create a new process | `createProcess.js` | `createProcess.sh` | `createProcess.py` |
| Upload BPMN to a process | `uploadBpmn.js` | `uploadBpmn.sh` | `uploadBpmn.py` |
| Map datatable to process | `mapDataToProcess.js` | `mapDataToProcess.sh` | `mapDataToProcess.py` |

### User Management
| Script | JavaScript | Bash | Python |
|--------|------------|------|--------|
| Add user to tenant | `addUser.js` | `addUser.sh` | `addUser.py` |

## JavaScript Library

The JavaScript examples use a shared library (`javascript/lib/ProcessMindApi.js`) that provides functions for all API operations:

**Tenant Functions:**
- `getTenant`, `updateTenant`, `getTenantStatistics`

**User Functions:**
- `getTenantUsers`, `addTenantUser`, `updateTenantUser`, `removeTenantUser`

**Process Functions:**
- `getProcesses`, `createProcess`, `getProcess`, `updateProcess`, `deleteProcess`
- `uploadBpmn`, `uploadBpmnFile`

**Process Mapping Functions:**
- `getProcessMappings`, `createProcessMapping`, `updateProcessMapping`, `deleteProcessMapping`

**Data Functions:**
- `getDatasets`, `createDataset`, `getDataset`, `deleteDataset`
- `getDatatables`, `createDatatable`, `getDatatable`, `getPresignedUploadUrl`, `uploadFile`

**Organization Functions:**
- `getOrganization`, `getOrganizationStatistics`
- `getOrganizationTenants`, `createOrganizationTenant`, `deleteOrganizationTenant`
- `getOrganizationUsers`, `updateOrganizationUser`, `removeOrganizationUser`

## API Notes

### User Management
When adding users to a tenant, provide the following fields:
- `email`: The user's email address (required)
- `firstName`, `lastName`: Optional name fields
- `isActiveInTenant`: Whether the user is active (default: true)
- `isAdminInTenant`: Whether the user has admin privileges (default: false)
- `isDeveloperInTenant`: Whether the user has developer access (default: false)

The API generates and returns the user ID in the response.

### Data Upload
When uploading files, the presigned URL endpoint requires:
- `datasetid`: The dataset ID containing the datatable
- `filename`: Name of the file being uploaded
- `filesize`: Size of the file in bytes
- `filelastmodified`: File's last modified timestamp in milliseconds

### Process Mapping
When mapping a datatable to a process:
- The process must have a BPMN model uploaded first
- Color is specified as an object: `{ id: "data-1" }` (options: "data-1" through "data-8")

## Need Help?

If you have any questions or need further assistance, feel free to reach out via the [contact page](https://processmind.com/about/contact-us) or open an issue here on GitHub. We're happy to help!

Happy mining!

---

## What is ProcessMind?

**ProcessMind** is a cloud-based SaaS platform that unifies process mining, modeling, and simulation—making operational excellence accessible to every organization. Designed for SMBs and midmarket teams, ProcessMind eliminates the need for multiple tools and complex integrations. With intuitive no-code onboarding, transparent pricing, and instant access, users can map, mine, and simulate processes in one place, working with imperfect data and leveraging AI-powered modeling for clear, actionable insights.

## What is Process Mining?

**Process mining** is a technique that analyzes business process data to uncover how work actually happens. By extracting insights from system logs and data exports, process mining helps organizations visualize workflows, identify bottlenecks, and discover opportunities for improvement. It bridges the gap between business and IT, enabling data-driven decisions and continuous process optimization.
