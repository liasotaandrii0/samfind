import { Controller } from "@nestjs/common";

import { ApiTags } from "@nestjs/swagger";

@ApiTags("Mail")
@Controller("mail")
export class MailController {
  constructor() { }
}
