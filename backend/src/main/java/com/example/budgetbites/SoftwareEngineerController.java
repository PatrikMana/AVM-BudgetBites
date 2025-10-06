package com.example.budgetbites;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/software-engineer")
public class SoftwareEngineerController {

    private final SoftwareEngineerService softwareEngineerService;

    public SoftwareEngineerController(SoftwareEngineerService softwareEngineerService) {
        this.softwareEngineerService = softwareEngineerService;
    }

    @GetMapping
    public List<SoftwareEngineer> getEngineers() {
        return softwareEngineerService.getAllSoftwareEngineers();
    }

    @PostMapping
    public void AddSoftwareEngineer(@RequestBody SoftwareEngineer    softwareEngineer) {
        softwareEngineerService.insertSoftwareEngineer(softwareEngineer);
    }
}
