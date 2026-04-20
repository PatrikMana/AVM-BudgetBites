package com.example.budgetbites.cocktail.dto.response;

import java.util.List;

public class CocktailListResponse {

    private List<CocktailResponse> cocktails;
    private int totalCount;
    private int page;
    private int pageSize;
    private int totalPages;

    public CocktailListResponse() {}

    public CocktailListResponse(List<CocktailResponse> cocktails, int totalCount, int page, int pageSize) {
        this.cocktails = cocktails;
        this.totalCount = totalCount;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) totalCount / pageSize);
    }

    public List<CocktailResponse> getCocktails() {
        return cocktails;
    }

    public void setCocktails(List<CocktailResponse> cocktails) {
        this.cocktails = cocktails;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
