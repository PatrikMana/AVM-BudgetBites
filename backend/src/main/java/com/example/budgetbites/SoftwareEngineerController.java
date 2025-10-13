package com.example.budgetbites;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController

public class SoftwareEngineerController {

    private final SoftwareEngineerService softwareEngineerService;

    public SoftwareEngineerController(SoftwareEngineerService softwareEngineerService) {
        this.softwareEngineerService = softwareEngineerService;
    }

    @GetMapping("api/get/software-engineer")
    public List<SoftwareEngineer> getEngineers() {
        return softwareEngineerService.getAllSoftwareEngineers();
    }

    @PostMapping(("api/post/software-engineer"))
    public void AddSoftwareEngineer(@RequestBody SoftwareEngineer    softwareEngineer) {
        softwareEngineerService.insertSoftwareEngineer(softwareEngineer);
    }
}
