package com.example.budgetbites;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HomeController {
    @RequestMapping("/")
    public String index() {
        return "index.html";
    }

    @PostMapping("/clicked")
    @ResponseBody
    public String handleClick() {
        return "You clicked the button!";
    }
}
